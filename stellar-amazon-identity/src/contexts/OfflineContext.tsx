import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getQueueStats } from '@/lib/storage/queue';

interface OfflineContextType {
  isOnline: boolean;
  pendingSync: number;
  refreshQueueStats: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshQueueStats = useCallback(async () => {
    try {
      const stats = await getQueueStats();
      setPendingSync(stats.pending + stats.processing);
    } catch {
      // Silently fail in offline mode
    }
  }, []);

  useEffect(() => {
    refreshQueueStats();
    const interval = setInterval(refreshQueueStats, 30000);
    return () => clearInterval(interval);
  }, [refreshQueueStats]);

  return (
    <OfflineContext.Provider value={{ isOnline, pendingSync, refreshQueueStats }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineContext() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOfflineContext must be used within an OfflineProvider');
  }
  return context;
}
