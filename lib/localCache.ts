/**
 * Servicio de caché local para almacenar datos en memoria y localStorage
 * Permite actualizaciones instantáneas mientras se sincroniza con Google Sheets en segundo plano
 */

const CACHE_KEYS = {
  CLIENTS: 'cache_clients',
  CALENDAR: 'cache_calendar',
  RESOURCES: 'cache_resources',
  PROPERTIES: 'cache_properties',
  SYNC_QUEUE: 'sync_queue',
  LAST_SYNC: 'last_sync',
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: unknown;
  timestamp: number;
  retries: number;
}

class LocalCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private syncQueue: SyncQueueItem[] = [];

  constructor() {
    this.loadFromStorage();
    this.loadSyncQueue();
  }

  /**
   * Cargar caché desde localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      Object.values(CACHE_KEYS).forEach((key) => {
        if (key !== CACHE_KEYS.SYNC_QUEUE && key !== CACHE_KEYS.LAST_SYNC) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry: CacheEntry<unknown> = JSON.parse(stored);
            this.cache.set(key, entry);
          }
        }
      });
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  /**
   * Guardar caché en localStorage
   */
  private saveToStorage(key: string, entry: CacheEntry<unknown>): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('Error saving cache to storage:', error);
    }
  }

  /**
   * Cargar cola de sincronización desde localStorage
   */
  private loadSyncQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(CACHE_KEYS.SYNC_QUEUE);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }

  /**
   * Guardar cola de sincronización en localStorage
   */
  private saveSyncQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(CACHE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  /**
   * Obtener datos del caché
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Verificar si el caché es muy antiguo (más de 1 hora)
    const age = Date.now() - entry.timestamp;
    if (age > 3600000) {
      this.cache.delete(key);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
      return null;
    }

    return entry.data as T;
  }

  /**
   * Guardar datos en el caché
   */
  set<T>(key: string, data: T): void {
    const existing = this.cache.get(key) as CacheEntry<T> | undefined;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: (existing?.version || 0) + 1,
    };

    this.cache.set(key, entry);
    this.saveToStorage(key, entry);
  }

  /**
   * Agregar item a la cola de sincronización
   */
  addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): void {
    const queueItem: SyncQueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    this.syncQueue.push(queueItem);
    this.saveSyncQueue();
  }

  /**
   * Obtener items pendientes de sincronización
   */
  getSyncQueue(): SyncQueueItem[] {
    return [...this.syncQueue];
  }

  /**
   * Remover item de la cola de sincronización
   */
  removeFromSyncQueue(id: string): void {
    this.syncQueue = this.syncQueue.filter((item) => item.id !== id);
    this.saveSyncQueue();
  }

  /**
   * Incrementar contador de reintentos
   */
  incrementRetry(id: string): void {
    const item = this.syncQueue.find((i) => i.id === id);
    if (item) {
      item.retries++;
      this.saveSyncQueue();
    }
  }

  /**
   * Limpiar caché
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } else {
      this.cache.clear();
      if (typeof window !== 'undefined') {
        Object.values(CACHE_KEYS).forEach((k) => {
          localStorage.removeItem(k);
        });
      }
    }
  }

  /**
   * Obtener timestamp de última sincronización
   */
  getLastSync(): number | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(CACHE_KEYS.LAST_SYNC);
    return stored ? parseInt(stored, 10) : null;
  }

  /**
   * Guardar timestamp de última sincronización
   */
  setLastSync(timestamp: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, timestamp.toString());
  }

  // Métodos específicos para cada tipo de dato
  getClients() {
    return this.get(CACHE_KEYS.CLIENTS);
  }

  setClients(data: unknown) {
    this.set(CACHE_KEYS.CLIENTS, data);
  }

  getCalendar() {
    return this.get(CACHE_KEYS.CALENDAR);
  }

  setCalendar(data: unknown) {
    this.set(CACHE_KEYS.CALENDAR, data);
  }

  getResources() {
    return this.get(CACHE_KEYS.RESOURCES);
  }

  setResources(data: unknown) {
    this.set(CACHE_KEYS.RESOURCES, data);
  }

  getProperties() {
    return this.get(CACHE_KEYS.PROPERTIES);
  }

  setProperties(data: unknown) {
    this.set(CACHE_KEYS.PROPERTIES, data);
  }
}

// Singleton instance
export const localCache = typeof window !== 'undefined' ? new LocalCache() : null;

export { CACHE_KEYS };
export type { SyncQueueItem };

