import { useHafizStore } from '@/store/useHafizStore';

// The 14 standard Tilawah Sajdahs in the Quran
const SAJDAH_PARAS = [
  9,  // Al-A'raf
  13, // Ar-Ra'd
  14, // An-Nahl
  15, // Al-Isra'
  16, // Maryam
  17, // Al-Hajj (Ayah 18)
  19, // Al-Furqan
  21, // An-Naml
  23, // As-Sajdah
  24, // Saad
  25, // Fussilat
  27, // An-Najm
  30, // Al-Inshiqaq
  30  // Al-Alaq
];

export function useSajdahDebt(): { totalEarned: number; remainingDebt: number } {
  const { totalKhatams, lastPara, totalSajdahsDone } = useHafizStore();

  // Total Sajdahs earned from completed Khatams (14 per Khatam)
  const earnedFromKhatams = totalKhatams * 14;
  
  // Total Sajdahs earned in the current in-progress Khatam
  const earnedInCurrentKhatam = SAJDAH_PARAS.filter(p => p <= lastPara).length;

  const totalEarned = earnedFromKhatams + earnedInCurrentKhatam;
  const remainingDebt = Math.max(0, totalEarned - totalSajdahsDone);

  return { totalEarned, remainingDebt };
}
