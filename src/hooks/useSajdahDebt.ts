import { useHafizStore } from '@/store/useHafizStore';

const SAJDAH_PARAS = [9, 13, 14, 15, 16, 17, 19, 21, 23, 24, 27, 30, 30];

export function useSajdahDebt(): { totalEarned: number; remainingDebt: number } {
  const { totalKhatams, lastPara, totalSajdahsDone } = useHafizStore();

  const totalEarned = (totalKhatams * 14) + SAJDAH_PARAS.filter(p => p <= lastPara).length;
  const remainingDebt = totalEarned - totalSajdahsDone;

  return { totalEarned, remainingDebt };
}
