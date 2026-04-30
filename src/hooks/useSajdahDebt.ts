import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

const SAJDAH_PARAS = [9, 13, 14, 15, 16, 17, 19, 21, 23, 24, 27, 30, 30];

export function useSajdahDebt() {
  const userState = useLiveQuery(() => db.userState.get(1));
  const dailyLogs = useLiveQuery(() => db.dailyLogs.toArray());

  if (userState === undefined || dailyLogs === undefined) {
    return { remainingDebt: 0, loading: true };
  }

  // Calculate Total Earned
  let earned = userState.totalKhatams * 14;
  
  // Add sajdahs passed in current khatam
  for (const para of SAJDAH_PARAS) {
    if (userState.lastPara >= para) {
      earned += 1;
    }
  }

  // Calculate Total Paid
  const paid = dailyLogs.reduce((sum, log) => sum + (log.sajdahsDone || 0), 0);

  const remainingDebt = Math.max(0, earned - paid);

  return { remainingDebt, loading: false };
}
