import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { DailyLogModel } from '@/models/DailyLog';

// SYNC DATA TO CLOUD
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

    const ops = logs.map((log: any) => ({
      updateOne: {
        filter: { userEmail: email, date: log.date },
        update: {
          $set: {
            userEmail: email,
            date: log.date,
            endPara: log.endPara,
            endPage: log.endPage,
            sajdahsDone: log.sajdahsDone,
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
    
    const logs = await DailyLogModel.find({ userEmail: email }).sort({ date: -1 });

    return NextResponse.json({ success: true, logs }, { status: 200 });
  } catch (error) {
    console.error('Sync GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
