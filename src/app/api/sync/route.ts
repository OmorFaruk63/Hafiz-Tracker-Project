import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { DailyLogModel } from '@/models/DailyLog';

export async function POST(req: Request) {
  try {
    const logs = await req.json();
    
    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ message: 'No logs provided' }, { status: 400 });
    }

    await connectToDatabase();

    const logsToInsert = logs.map((log: any) => ({
      date: log.date,
      endPara: log.endPara,
      endPage: log.endPage,
      sajdahsDone: log.sajdahsDone,
    }));

    await DailyLogModel.insertMany(logsToInsert);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Sync API Error:', error);
    return NextResponse.json({ error: 'Failed to sync logs' }, { status: 500 });
  }
}
