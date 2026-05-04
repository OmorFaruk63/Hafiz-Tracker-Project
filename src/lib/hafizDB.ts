import Dexie, { Table } from 'dexie';

export interface DailyLog {
  id?: number;
  date: string; // YYYY-MM-DD
  endPara: number;
  endPage: number;
  sajdahsDone: number;
  loggedAt?: string;
  isSynced: boolean;
}

export class HafizTrackerDB extends Dexie {
  dailyLogs!: Table<DailyLog, number>;

  constructor() {
    super('hafizDB');
    this.version(1).stores({
      dailyLogs: '++id, date, isSynced',
    });
  }
}

export const db = new HafizTrackerDB();
