import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { DailyLogModel } from '@/models/DailyLog';

type SyncLog = {
  date: string;
  endPara: number;
  endPage: number;
  sajdahsDone?: number;
  loggedAt?: string;
};

type SyncRequestBody = {
  email?: string;
  logs?: SyncLog[];
};

// SYNC DATA TO CLOUD
export async function POST(req: Request) {
  try {
    const { email, logs } = (await req.json()) as SyncRequestBody;
    
    if (!email) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ message: 'No logs provided' }, { status: 200 });
    }

    await connectToDatabase();

    const ops = logs.map((log) => ({
      updateOne: {
        filter: { userEmail: email, loggedAt: log.loggedAt },
        update: {
          $set: {
            userEmail: email,
            date: log.date,
            endPara: log.endPara,
            endPage: log.endPage,
            sajdahsDone: log.sajdahsDone,
            loggedAt: log.loggedAt,
          }
        },
        upsert: true
      }
    }));

    await DailyLogModel.bulkWrite(ops, { ordered: false });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Sync POST Error:', error);
    return NextResponse.json({ error: 'Failed to sync logs' }, { status: 500 });
  }
}

// RESTORE DATA FROM CLOUD
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectToDatabase();
    
    const logs = await DailyLogModel.find({ userEmail: email }).sort({ date: -1, loggedAt: -1, createdAt: -1 });

    return NextResponse.json({ success: true, logs }, { status: 200 });
  } catch (error) {
    console.error('Sync GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
