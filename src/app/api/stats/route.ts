import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { DailyLogModel } from '@/models/DailyLog';

const PAGE_PER_PARA = 20;
const TOTAL_PARAS = 30;

function toParaUnits(endPara: number, endPage: number) {
  return endPara + endPage / PAGE_PER_PARA;
}

function calcDailyReads(logs: Array<{ date: string; endPara: number; endPage: number; loggedAt?: string }>) {
  const sorted = [...logs].sort((a, b) => {
    const dateDelta = a.date.localeCompare(b.date);
    if (dateDelta !== 0) return dateDelta;

    const leftTime = a.loggedAt ? new Date(a.loggedAt).getTime() : 0;
    const rightTime = b.loggedAt ? new Date(b.loggedAt).getTime() : 0;

    if (leftTime !== rightTime) return leftTime - rightTime;

    return 0;
  });
  let prevUnits: number | null = null;

  return sorted.map((log) => {
    const currentUnits = toParaUnits(log.endPara, log.endPage);
    let delta = prevUnits === null ? currentUnits : currentUnits - prevUnits;

    if (prevUnits !== null && delta < 0) {
      delta = (TOTAL_PARAS - prevUnits) + currentUnits;
    }

    if (delta < 0) delta = 0;

    prevUnits = currentUnits;

    return {
      date: log.date,
      parasRead: Number(delta.toFixed(2)),
      endPara: log.endPara,
      endPage: log.endPage
    };
  });
}

function calcMonthlyTotals(daily: Array<{ date: string; parasRead: number }>) {
  const totals = new Map<string, number>();

  for (const entry of daily) {
    const month = entry.date.slice(0, 7);
    totals.set(month, (totals.get(month) || 0) + entry.parasRead);
  }

  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, parasRead]) => ({
      month,
      parasRead: Number(parasRead.toFixed(2))
    }));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectToDatabase();

    const logs = await DailyLogModel.find({ userEmail: email })
      .sort({ date: 1, loggedAt: 1, createdAt: 1 })
      .select({ date: 1, endPara: 1, endPage: 1, loggedAt: 1, _id: 0 });

    const daily = calcDailyReads(logs);
    const monthly = calcMonthlyTotals(daily);

    return NextResponse.json({ success: true, daily, monthly }, { status: 200 });
  } catch (error) {
    console.error('Stats GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
