/**
 * Cliente API con soporte para caché local y sincronización en segundo plano
 */

import { localCache } from './localCache';
import { syncQueue } from './syncQueue';

/**
 * Realizar petición GET con caché
 */
export async function apiGet<T>(
  endpoint: string,
  cacheKey: string,
  options?: { forceRefresh?: boolean }
): Promise<T> {
  // Intentar cargar desde caché primero
  if (!options?.forceRefresh && localCache) {
    const cached = localCache.get<T>(cacheKey);
    if (cached) {
      // Cargar datos frescos en segundo plano
      fetch(endpoint)
        .then((res) => res.json())
        .then((data) => {
          if (localCache) {
            localCache.set(cacheKey, data);
          }
        })
        .catch((err) => {
          console.warn('Background refresh failed:', err);
        });
      
      return cached;
    }
  }

  // Si no hay caché, cargar desde API
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Guardar en caché
  if (localCache) {
    localCache.set(cacheKey, data);
  }

  return data as T;
}

/**
 * Realizar petición POST con caché optimista
 */
export async function apiPost<TRequest, TResponse>(
  endpoint: string,
  data: TRequest,
  cacheKey: string,
  updateCache: (data: TRequest, response: TResponse, current?: unknown) => unknown
): Promise<TResponse> {
  // Guardar estado anterior para revertir si es necesario
  let previousData: unknown = null;
  if (localCache) {
    previousData = localCache.get(cacheKey);
  }

  // Actualizar caché optimistamente
  let optimisticData: unknown = null;
  if (localCache) {
    optimisticData = updateCache(data, {} as TResponse, previousData);
    localCache.set(cacheKey, optimisticData);
  }

  try {
    // Intentar guardar en servidor
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create: ${response.statusText}`);
    }

    const result = await response.json();

    // Actualizar caché con respuesta real
    if (localCache) {
      const finalData = updateCache(data, result, previousData);
      localCache.set(cacheKey, finalData);
    }

    return result as TResponse;
  } catch (error) {
    // Si falla, agregar a cola de sincronización
    if (localCache) {
      localCache.addToSyncQueue({
        type: 'create',
        endpoint,
        data,
      });
    }

    // Revertir caché optimista si existe
    if (localCache && previousData !== null) {
      localCache.set(cacheKey, previousData);
    } else if (localCache) {
      // Si no había datos previos, limpiar el caché optimista
      localCache.clear(cacheKey);
    }

    throw error;
  }
}

/**
 * Realizar petición PUT con caché optimista
 */
export async function apiPut<TRequest, TResponse>(
  endpoint: string,
  data: TRequest,
  cacheKey: string,
  updateCache: (data: TRequest, response: TResponse, current?: unknown) => unknown
): Promise<TResponse> {
  // Guardar estado anterior para revertir si es necesario
  let previousData: unknown = null;
  if (localCache) {
    previousData = localCache.get(cacheKey);
  }

  // Actualizar caché optimistamente
  let optimisticData: unknown = null;
  if (localCache) {
    optimisticData = updateCache(data, {} as TResponse, previousData);
    localCache.set(cacheKey, optimisticData);
  }

  try {
    // Intentar actualizar en servidor
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update: ${response.statusText}`);
    }

    const result = await response.json();

    // Actualizar caché con respuesta real
    if (localCache) {
      const finalData = updateCache(data, result, previousData);
      localCache.set(cacheKey, finalData);
    }

    return result as TResponse;
  } catch (error) {
    // Si falla, agregar a cola de sincronización
    if (localCache) {
      localCache.addToSyncQueue({
        type: 'update',
        endpoint,
        data,
      });
    }

    // Revertir caché optimista
    if (localCache && previousData !== null) {
      localCache.set(cacheKey, previousData);
    } else if (localCache) {
      localCache.clear(cacheKey);
    }

    throw error;
  }
}

/**
 * Realizar petición DELETE con caché optimista
 */
export async function apiDelete<TResponse>(
  endpoint: string,
  cacheKey: string,
  updateCache: (response: TResponse) => unknown
): Promise<TResponse> {
  // Guardar estado anterior para revertir si es necesario
  let previousData: unknown = null;
  if (localCache) {
    previousData = localCache.get(cacheKey);
  }

  // Actualizar caché optimistamente
  let optimisticData: unknown = null;
  if (localCache && previousData) {
    // Crear una copia del estado anterior y aplicar la eliminación
    optimisticData = updateCache({} as TResponse);
    localCache.set(cacheKey, optimisticData);
  }

  try {
    // Intentar eliminar en servidor
    const response = await fetch(endpoint, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete: ${response.statusText}`);
    }

    const result = await response.json().catch(() => ({} as TResponse));

    // Actualizar caché con respuesta real
    if (localCache && optimisticData) {
      const finalData = updateCache(result);
      localCache.set(cacheKey, finalData);
    }

    return result as TResponse;
  } catch (error) {
    // Si falla, agregar a cola de sincronización
    if (localCache) {
      localCache.addToSyncQueue({
        type: 'delete',
        endpoint,
        data: {},
      });
    }

    // Revertir caché optimista
    if (localCache && previousData) {
      localCache.set(cacheKey, previousData);
    }

    throw error;
  }
}

/**
 * Inicializar sistema de sincronización
 */
export function initSyncQueue(): void {
  if (syncQueue && typeof window !== 'undefined') {
    syncQueue.start();
  }
}

