import { useHafizStore } from '@/store/useHafizStore';

// The 15 standard Tilawah Sajdahs in the Quran (by para)
const SAJDAH_POINTS = [
  { para: 9 },  // Al-A'raf
  { para: 13 }, // Ar-Ra'd
  { para: 14 }, // An-Nahl
  { para: 15 }, // Al-Isra'
  { para: 16 }, // Maryam
  { para: 17 }, // Al-Hajj (Ayah 18)
  { para: 17 }, // Al-Hajj (Ayah 77)
  { para: 19 }, // Al-Furqan
  { para: 19 }, // An-Naml
  { para: 21 }, // As-Sajdah
  { para: 23 }, // Sad
  { para: 24 }, // Fussilat
  { para: 27 }, // An-Najm
  { para: 30 }, // Al-Inshiqaq
  { para: 30 }  // Al-Alaq
];

export function useSajdahDebt(): { totalEarned: number; remainingDebt: number } {
  const { totalKhatams, lastPara, totalSajdahsDone } = useHafizStore();

  // Total Sajdahs earned from completed Khatams (15 per Khatam)
  const earnedFromKhatams = totalKhatams * 15;
  
  // Total Sajdahs earned in the current in-progress Khatam
  const earnedInCurrentKhatam = SAJDAH_POINTS.filter(point => point.para <= lastPara).length;

  const totalEarned = earnedFromKhatams + earnedInCurrentKhatam;
  const remainingDebt = Math.max(0, totalEarned - totalSajdahsDone);

  return { totalEarned, remainingDebt };
}
