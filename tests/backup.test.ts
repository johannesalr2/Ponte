import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { PonteDB } from '../src/db/db';
import { DEFAULT_PREFS } from '../src/db/types';
import { exportBackup, importBackup } from '../src/lib/backup';
import { newCard } from '../src/lib/fsrs';

let n = 0;
const dbs: PonteDB[] = [];
function freshDb() {
  const db = new PonteDB(`test-${n++}`);
  dbs.push(db);
  return db;
}
afterEach(async () => {
  for (const db of dbs.splice(0)) await db.delete();
});

describe('backup', () => {
  it('exporta e importa o progresso sem perdas', async () => {
    const a = freshDb();
    await a.settings.put({
      key: 'profile',
      value: {
        profession: 'koch',
        industry: null,
        level: 'B1',
        goal: 'trabalho',
        locale: 'pt-BR',
        createdAt: 1,
      },
    });
    await a.settings.put({ key: 'prefs', value: DEFAULT_PREFS });
    await a.cards.put({ ...newCard(1000), termId: 'ko-herd', profession: 'koch', addedAt: 1000 });
    await a.reviews.add({
      termId: 'ko-herd',
      rating: 3,
      state: 'new',
      reviewedAt: 2000,
      elapsedDays: 0,
      scheduledDays: 0,
    });
    await a.days.put({ date: '2026-10-14', reviews: 1, newCards: 1, exercises: 2, correct: 1 });

    const backup = JSON.parse(JSON.stringify(await exportBackup(a)));
    const b = freshDb();
    const result = await importBackup(b, backup);
    expect(result).toEqual({ ok: true, cards: 1, reviews: 1 });
    expect(await b.cards.get('ko-herd')).toMatchObject({ profession: 'koch', state: 'new' });
    expect(await b.days.get('2026-10-14')).toMatchObject({ exercises: 2 });
    expect((await b.settings.get('profile'))?.value).toMatchObject({ profession: 'koch' });
  });

  it('recusa arquivo inválido sem apagar o progresso atual', async () => {
    const db = freshDb();
    await db.cards.put({ ...newCard(1), termId: 'x', profession: 'koch', addedAt: 1 });
    const result = await importBackup(db, { format: 'outra-coisa' });
    expect(result.ok).toBe(false);
    expect(await db.cards.count()).toBe(1);
  });

  it('recusa backup com dados fora do formato (ex.: nota 5)', async () => {
    const db = freshDb();
    const backup = await exportBackup(db);
    const bad = {
      ...backup,
      reviews: [
        { termId: 'x', rating: 5, state: 'new', reviewedAt: 1, elapsedDays: 0, scheduledDays: 0 },
      ],
    };
    expect((await importBackup(db, bad)).ok).toBe(false);
  });
});
