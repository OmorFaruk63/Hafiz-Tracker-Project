import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { DailyLogModel } from '@/models/DailyLog';

export async function POST(req: Request) {
  try {
    const { email, logs } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ message: 'No logs provided' }, { status: 200 });
    }

    await connectToDatabase();

    const logsToInsert = logs.map((log: any) => ({
      userEmail: email,
      date: log.date,
      endPara: log.endPara,
      endPage: log.endPage,
      sajdahsDone: log.sajdahsDone,
    }));

    // Use bulkWrite or insertMany with ordered: false to skip duplicates if any
    await DailyLogModel.insertMany(logsToInsert, { ordered: false }).catch(err => {
      // Ignore duplicate key errors if we add unique constraints later
      console.log('Some logs might have already been synced');
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Sync API Error:', error);
    return NextResponse.json({ error: 'Failed to sync logs' }, { status: 500 });
  }
}
