import Dexie, { Table } from 'dexie';

export interface UserState {
  id: number; // always 1
  totalKhatams: number;
  lastPara: number;
  lastPage: number;
}

export interface DailyLog {
  id?: number; // auto-increment
  date: string; // YYYY-MM-DD
  parasRead: number;
  pagesRead: number;
  sajdahsDone: number;
  loggedAt?: string;
  isSynced: boolean;
}

export class HafizTrackerDB extends Dexie {
  userState!: Table<UserState, number>;
  dailyLogs!: Table<DailyLog, number>;

  constructor() {
    super('HafizTrackerDB');
    this.version(1).stores({
      userState: 'id', // Primary key is id
      dailyLogs: '++id, date, isSynced' // Auto-increment id, index on date and isSynced
    });
  }
}

export const db = new HafizTrackerDB();
