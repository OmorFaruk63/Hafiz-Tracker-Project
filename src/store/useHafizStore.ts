import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HafizState {
  totalKhatams: number;
  lastPara: number;
  lastPage: number;
  totalSajdahsDone: number;
  
  // Actions
  setTotalKhatams: (khatams: number) => void;
  setLastReadPosition: (para: number, page: number) => void;
  setTotalSajdahsDone: (sajdahs: number) => void;
  incrementSajdahs: (amount: number) => void;
  addKhatam: () => void;
}

export const useHafizStore = create<HafizState>()(
  persist(
    (set) => ({
      totalKhatams: 0,
      lastPara: 1,
      lastPage: 0,
      totalSajdahsDone: 0,

      setTotalKhatams: (khatams) => set({ totalKhatams: khatams }),
      setLastReadPosition: (para, page) => set({ lastPara: para, lastPage: page }),
      setTotalSajdahsDone: (sajdahs) => set({ totalSajdahsDone: sajdahs }),
      incrementSajdahs: (amount) => set((state) => ({ totalSajdahsDone: state.totalSajdahsDone + amount })),
      addKhatam: () => set((state) => ({ totalKhatams: state.totalKhatams + 1 })),
    }),
    {
      name: 'hafiz-storage', // Saves to localStorage automatically
    }
  )
);
