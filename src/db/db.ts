import Dexie, { type Table } from 'dexie';
import type { CardRow, CvRow, DayRow, PracticeRow, ReviewRow, SettingRow } from './types';

/** IndexedDB local. Nada sai do aparelho. */
export class PonteDB extends Dexie {
  settings!: Table<SettingRow, string>;
  cards!: Table<CardRow, string>;
  reviews!: Table<ReviewRow, number>;
  days!: Table<DayRow, string>;
  cv!: Table<CvRow, string>;
  practice!: Table<PracticeRow, number>;

  constructor(name = 'ponte-tecnica') {
    super(name);
    this.version(1).stores({
      settings: 'key',
      cards: 'termId, due, state, profession',
      reviews: '++id, termId, reviewedAt',
      days: 'date',
      cv: 'id',
    });
    // v2: histórico dos exercícios por termo
    this.version(2).stores({ practice: '++id, termId, at' });
  }
}

export const db = new PonteDB();
