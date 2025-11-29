'use client';

import { useEffect } from 'react';
import { initSyncQueue } from '@/lib/apiClient';

/**
 * Provider que inicializa el sistema de sincronización en segundo plano
 */
export default function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inicializar cola de sincronización cuando la app se carga
    initSyncQueue();
  }, []);

  return <>{children}</>;
}

