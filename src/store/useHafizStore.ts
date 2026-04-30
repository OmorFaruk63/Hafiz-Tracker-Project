import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HafizState {
  userEmail: string;
  totalKhatams: number;
  lastPara: number;
  lastPage: number;
  totalSajdahsDone: number;
  
  // Actions
  setUserEmail: (email: string) => void;
  setTotalKhatams: (khatams: number) => void;
  setLastReadPosition: (para: number, page: number) => void;
  setTotalSajdahsDone: (sajdahs: number) => void;
  incrementSajdahs: (amount: number) => void;
  addKhatam: () => void;
  startNewKhatam: () => void;
}

export const useHafizStore = create<HafizState>()(
  persist(
    (set) => ({
      userEmail: '',
      totalKhatams: 0,
      lastPara: 1,
      lastPage: 0,
      totalSajdahsDone: 0,

      setUserEmail: (email) => set({ userEmail: email }),
      setTotalKhatams: (khatams) => set({ totalKhatams: khatams }),
      setLastReadPosition: (para, page) => set({ lastPara: para, lastPage: page }),
      setTotalSajdahsDone: (sajdahs) => set({ totalSajdahsDone: sajdahs }),
      incrementSajdahs: (amount) => set((state) => ({ totalSajdahsDone: state.totalSajdahsDone + amount })),
      addKhatam: () => set((state) => ({ totalKhatams: state.totalKhatams + 1 })),
      startNewKhatam: () => set((state) => ({ 
        totalKhatams: state.totalKhatams + 1,
        lastPara: 1,
        lastPage: 0
      })),
    }),
    {
      name: 'hafiz-storage',
    }
  )
);
