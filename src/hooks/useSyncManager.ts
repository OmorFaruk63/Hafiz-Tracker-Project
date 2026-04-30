import { useCallback, useEffect } from 'react';
import { db } from '@/lib/hafizDB';
import { useHafizStore } from '@/store/useHafizStore';

export function useSyncManager() {
  const { userEmail } = useHafizStore();

  const syncNow = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine || !userEmail) return;

    try {
      const logsToSync = await db.dailyLogs.filter(log => !log.isSynced).toArray();
      
      if (logsToSync.length === 0) return;

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
        
        console.log(`Successfully synced ${idsToUpdate.length} logs for ${userEmail}.`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [userEmail]);

  useEffect(() => {
    syncNow();
    window.addEventListener('online', syncNow);
    
    return () => {
      window.removeEventListener('online', syncNow);
    };
  }, [syncNow, userEmail]);

  return { syncNow };
}
