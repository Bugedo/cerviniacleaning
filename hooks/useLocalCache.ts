/**
 * Hook de React para usar el caché local
 */

import { useState, useEffect, useCallback } from 'react';
import { localCache, SyncQueueItem } from '@/lib/localCache';
import { syncQueue } from '@/lib/syncQueue';

interface UseLocalCacheOptions {
  cacheKey: string;
  fetchFn: () => Promise<Response>;
  immediate?: boolean;
}

export function useLocalCache<T>({ cacheKey, fetchFn, immediate = true }: UseLocalCacheOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  /**
   * Cargar datos desde caché o API
   */
  const loadData = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        setError(null);

        // Intentar cargar desde caché primero
        if (!forceRefresh && localCache) {
          const cached = localCache.get<T>(cacheKey);
          if (cached) {
            setData(cached);
            setLoading(false);
            setIsStale(false);

            // Cargar datos frescos en segundo plano
            try {
              const response = await fetchFn();
              if (response.ok) {
                const freshData = await response.json();
                localCache.set(cacheKey, freshData);
                setData(freshData as T);
              }
            } catch (err) {
              console.warn('Background refresh failed, using cached data:', err);
              setIsStale(true);
            }
            return;
          }
        }

        // Si no hay caché o se fuerza refresh, cargar desde API
        const response = await fetchFn();
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const result = await response.json();

        if (localCache) {
          localCache.set(cacheKey, result);
        }

        setData(result as T);
        setIsStale(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, fetchFn],
  );

  /**
   * Actualizar datos en caché local
   */
  const updateCache = useCallback(
    (newData: T) => {
      if (localCache) {
        localCache.set(cacheKey, newData);
      }
      setData(newData);
    },
    [cacheKey],
  );

  /**
   * Agregar a cola de sincronización
   */
  const queueSync = useCallback((item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>) => {
    if (localCache) {
      localCache.addToSyncQueue(item);
    }
  }, []);

  /**
   * Forzar recarga desde API
   */
  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    if (immediate) {
      loadData();
    }

    // Iniciar sincronización en segundo plano
    if (syncQueue && typeof window !== 'undefined') {
      syncQueue.start();
    }

    return () => {
      // No detener la cola al desmontar, debe seguir ejecutándose
    };
  }, [immediate, loadData]);

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    updateCache,
    queueSync,
  };
}
