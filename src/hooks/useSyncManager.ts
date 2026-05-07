import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/hafizDB';
import { useHafizStore } from '@/store/useHafizStore';
import { useLiveQuery } from 'dexie-react-hooks';

export function useSyncManager() {
  const { userEmail } = useHafizStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Use live query to keep track of unsynced logs
  const unsyncedCount = useLiveQuery(
    () => db.dailyLogs.filter(log => !log.isSynced).count(),
    []
  ) ?? 0;

  const syncNow = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine || !userEmail || isSyncing) return;

    try {
      setIsSyncing(true);
      const logsToSync = await db.dailyLogs.filter(log => !log.isSynced).toArray();
      
      if (logsToSync.length === 0) {
        setIsSyncing(false);
        setLastSyncTime(new Date());
        return;
      }

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          logs: logsToSync
        }),
      });

      if (response.ok) {
        const idsToUpdate = logsToSync.map(log => log.id).filter((id): id is number => id !== undefined);
        
        await db.transaction('rw', db.dailyLogs, async () => {
          for (const id of idsToUpdate) {
            await db.dailyLogs.update(id, { isSynced: true });
          }
        });
        
        setLastSyncTime(new Date());
        console.log(`Successfully synced ${idsToUpdate.length} logs for ${userEmail}.`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [userEmail, isSyncing]);

  // Initial and Periodic Sync
  useEffect(() => {
    const initialSyncTimer = window.setTimeout(() => {
      void syncNow();
    }, 0);

    window.addEventListener('online', syncNow);
    
    // Auto sync every 5 minutes if online
    const interval = window.setInterval(() => {
      void syncNow();
    }, 5 * 60 * 1000);
    
    return () => {
      window.removeEventListener('online', syncNow);
      window.clearTimeout(initialSyncTimer);
      clearInterval(interval);
    };
  }, [syncNow, userEmail]);

  return { syncNow, isSyncing, lastSyncTime, unsyncedCount };
}
