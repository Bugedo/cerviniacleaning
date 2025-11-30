/**
 * Sistema de sincronización en segundo plano
 * Procesa la cola de actualizaciones pendientes y las sincroniza con Google Sheets
 */

import { localCache, SyncQueueItem } from './localCache';

const MAX_RETRIES = 3;
const SYNC_INTERVAL = 5000; // 5 segundos
const BATCH_SIZE = 5; // Procesar 5 items a la vez

class SyncQueue {
  private isProcessing = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Iniciar procesamiento de la cola
   */
  start(): void {
    if (this.isProcessing || typeof window === 'undefined') return;

    this.isProcessing = true;
    this.processQueue();

    // Procesar cada 5 segundos
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, SYNC_INTERVAL);
  }

  /**
   * Detener procesamiento de la cola
   */
  stop(): void {
    this.isProcessing = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Procesar items de la cola
   */
  private async processQueue(): Promise<void> {
    if (!localCache) return;

    const queue = localCache.getSyncQueue();
    if (queue.length === 0) return;

    // Procesar en lotes
    const batch = queue.slice(0, BATCH_SIZE);

    for (const item of batch) {
      try {
        await this.syncItem(item);
        localCache.removeFromSyncQueue(item.id);
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);

        // Incrementar contador de reintentos
        localCache.incrementRetry(item.id);

        // Si excede el máximo de reintentos, remover de la cola
        if (item.retries >= MAX_RETRIES) {
          console.error(`Max retries reached for item ${item.id}, removing from queue`);
          localCache.removeFromSyncQueue(item.id);
        }
      }
    }

    // Actualizar timestamp de última sincronización
    localCache.setLastSync(Date.now());
  }

  /**
   * Sincronizar un item individual
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const { type, endpoint, data } = item;

    let response: Response;

    switch (type) {
      case 'create':
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        break;

      case 'update':
        response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        break;

      case 'delete':
        response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        break;

      default:
        throw new Error(`Unknown sync type: ${type}`);
    }

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    // Invalidar caché relacionado para forzar recarga
    this.invalidateRelatedCache(endpoint);
  }

  /**
   * Invalidar caché relacionado con el endpoint
   */
  private invalidateRelatedCache(endpoint: string): void {
    if (!localCache) return;

    if (endpoint.includes('/clients')) {
      localCache.clear('cache_clients');
      localCache.clear('cache_properties');
    } else if (endpoint.includes('/calendar')) {
      localCache.clear('cache_calendar');
      localCache.clear('cache_resources'); // Los recursos dependen del calendario
    } else if (endpoint.includes('/resources')) {
      localCache.clear('cache_resources');
    }
  }

  /**
   * Forzar sincronización inmediata de todos los items pendientes
   */
  async forceSync(): Promise<void> {
    if (!localCache) return;

    const queue = localCache.getSyncQueue();
    if (queue.length === 0) return;

    console.log(`Force syncing ${queue.length} items...`);

    // Procesar todos los items
    const allItems = [...queue];
    for (const item of allItems) {
      try {
        await this.syncItem(item);
        localCache.removeFromSyncQueue(item.id);
      } catch (error) {
        console.error(`Error in force sync for item ${item.id}:`, error);
        localCache.incrementRetry(item.id);
      }
    }

    localCache.setLastSync(Date.now());
  }
}

// Singleton instance
export const syncQueue = typeof window !== 'undefined' ? new SyncQueue() : null;
