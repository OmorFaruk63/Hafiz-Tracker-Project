import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { DailyLogModel } from '@/models/DailyLog';

export async function POST(req: Request) {
  try {
    const logs = await req.json();
    
    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ message: 'No logs provided to sync' }, { status: 400 });
    }

    await connectToDatabase();

    // Map logs to remove local dexie specific fields (id, isSynced)
    const logsToInsert = logs.map((log: any) => ({
      date: log.date,
      parasRead: log.parasRead,
      pagesRead: log.pagesRead,
      sajdahsDone: log.sajdahsDone,
    }));

    // For a real app, you might want to use updateOne with upsert to prevent duplicates
    // But for this simple sync, we insert the logs that were not synced.
    await DailyLogModel.insertMany(logsToInsert);

    return NextResponse.json({ success: true, count: logsToInsert.length });
  } catch (error) {
    console.error('Sync API Error:', error);
    return NextResponse.json({ error: 'Failed to sync logs' }, { status: 500 });
  }
}
