import { useCallback, useEffect } from 'react';
import { db } from '@/lib/hafizDB';

export function useSyncManager() {
  const syncNow = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    try {
      const logsToSync = await db.dailyLogs.filter(log => !log.isSynced).toArray();
      
      if (logsToSync.length === 0) return;

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logsToSync),
      });

      if (response.ok) {
        const idsToUpdate = logsToSync.map(log => log.id).filter((id): id is number => id !== undefined);
        
        await db.transaction('rw', db.dailyLogs, async () => {
          for (const id of idsToUpdate) {
            await db.dailyLogs.update(id, { isSynced: true });
          }
        });
        
        console.log(`Successfully synced ${idsToUpdate.length} logs to cloud.`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, []);

  useEffect(() => {
    syncNow();
    window.addEventListener('online', syncNow);
    
    return () => {
      window.removeEventListener('online', syncNow);
    };
  }, [syncNow]);

  return { syncNow };
}
