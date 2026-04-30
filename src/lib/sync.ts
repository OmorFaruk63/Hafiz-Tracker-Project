import { db } from './db';

export async function syncWithServer() {
  // Check if we are in a browser environment and online
  if (typeof window === 'undefined' || !navigator.onLine) {
    return;
  }

  try {
    // 1. Query Dexie for all dailyLogs where isSynced === false
    // Since isSynced is indexed, we can query it, or filter.
    // In db.ts it's indexed, so we can use filter since boolean index can be tricky in some older Dexie versions
    const logsToSync = await db.dailyLogs.filter(log => !log.isSynced).toArray();

    if (logsToSync.length === 0) {
      return; // Nothing to sync
    }

    // 2. Send this batch to the Next.js API route
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logsToSync),
    });

    if (response.ok) {
      // 3. Update those specific records in Dexie to isSynced: true
      const idsToUpdate = logsToSync.map(log => log.id).filter((id): id is number => id !== undefined);
      
      await db.transaction('rw', db.dailyLogs, async () => {
        for (const id of idsToUpdate) {
          await db.dailyLogs.update(id, { isSynced: true });
        }
      });
      
      console.log(`Successfully synced ${idsToUpdate.length} logs to the server.`);
    } else {
      console.error('Server responded with an error during sync');
    }
  } catch (error) {
    console.error('Failed to sync with server:', error);
  }
}
