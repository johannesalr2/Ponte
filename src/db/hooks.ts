import { useLiveQuery } from 'dexie-react-hooks';
import { dayKey, endOfDay } from '@/lib/dates';
import type { ExerciseKind } from '@/lib/exercises';
import { DAY, newCard, schedule, type Rating } from '@/lib/fsrs';
import type { ModeStat } from '@/lib/practice';
import { db } from './db';
import {
  DEFAULT_PREFS,
  type CardRow,
  type DayRow,
  type PracticeRow,
  type PracticeStats,
  type Prefs,
  type Profile,
} from './types';

// ------------------------------------------------------------ configurações

/** `undefined` enquanto carrega; `null` se ainda não fez o onboarding. */
export function useProfile(): Profile | null | undefined {
  return useLiveQuery(async () => {
    const row = await db.settings.get('profile');
    return row?.key === 'profile' ? row.value : null;
  });
}

export function usePrefs(): Prefs {
  const prefs = useLiveQuery(async () => {
    const row = await db.settings.get('prefs');
    return row?.key === 'prefs' ? { ...DEFAULT_PREFS, ...row.value } : DEFAULT_PREFS;
  });
  return prefs ?? DEFAULT_PREFS;
}

export async function saveProfile(profile: Profile) {
  await db.settings.put({ key: 'profile', value: profile });
}

export async function savePrefs(patch: Partial<Prefs>) {
  const row = await db.settings.get('prefs');
  const current = row?.key === 'prefs' ? row.value : DEFAULT_PREFS;
  await db.settings.put({ key: 'prefs', value: { ...DEFAULT_PREFS, ...current, ...patch } });
}

// ------------------------------------------------------------ atividade diária

async function bumpDay(patch: Partial<Omit<DayRow, 'date'>>, now = Date.now()) {
  const date = dayKey(now);
  await db.transaction('rw', db.days, async () => {
    const day = (await db.days.get(date)) ?? {
      date,
      reviews: 0,
      newCards: 0,
      exercises: 0,
      correct: 0,
    };
    await db.days.put({
      ...day,
      reviews: day.reviews + (patch.reviews ?? 0),
      newCards: day.newCards + (patch.newCards ?? 0),
      exercises: day.exercises + (patch.exercises ?? 0),
      correct: day.correct + (patch.correct ?? 0),
    });
  });
}

/**
 * Registra a resposta de um exercício: conta para o mapa de calor, guarda o
 * resultado por termo e, se errou um termo em revisão, antecipa a próxima
 * revisão dele para no máximo amanhã.
 */
export async function recordPractice(
  termIds: string[],
  kind: ExerciseKind,
  correct: boolean,
  now = Date.now(),
) {
  await db.transaction('rw', db.days, db.practice, db.cards, async () => {
    await bumpDay({ exercises: 1, correct: correct ? 1 : 0 }, now);
    await db.practice.bulkAdd(termIds.map((termId) => ({ termId, kind, correct, at: now })));
    if (correct) return;
    for (const termId of termIds) {
      const card = await db.cards.get(termId);
      if (card && card.state === 'review' && card.due > now + DAY) {
        await db.cards.update(termId, { due: now + DAY });
      }
    }
  });
}

/** Resultados dos exercícios nos últimos 30 dias. */
export function useRecentPractice(): PracticeRow[] | undefined {
  return useLiveQuery(() =>
    db.practice
      .where('at')
      .above(Date.now() - 30 * DAY)
      .toArray(),
  );
}

export function usePracticeStats(): PracticeStats | undefined {
  return useLiveQuery(async () => {
    const row = await db.settings.get('practiceStats');
    return row?.key === 'practiceStats' ? row.value : {};
  });
}

export async function savePracticeStat(key: keyof PracticeStats, stat: ModeStat) {
  const row = await db.settings.get('practiceStats');
  const current = row?.key === 'practiceStats' ? row.value : {};
  await db.settings.put({ key: 'practiceStats', value: { ...current, [key]: stat } });
}

export function useDays(): DayRow[] | undefined {
  return useLiveQuery(() => db.days.toArray());
}

// ------------------------------------------------------------ cartões FSRS

export function useCards(): CardRow[] | undefined {
  return useLiveQuery(() => db.cards.toArray());
}

export function useCard(termId: string | undefined): CardRow | null | undefined {
  return useLiveQuery(
    async () => (termId ? ((await db.cards.get(termId)) ?? null) : null),
    [termId],
  );
}

export async function addCard(termId: string, profession: string, now = Date.now()) {
  const exists = await db.cards.get(termId);
  if (exists) return;
  await db.cards.put({ ...newCard(now), termId, profession, addedAt: now });
}

export async function removeCard(termId: string) {
  await db.cards.delete(termId);
}

export async function rateCard(card: CardRow, rating: Rating, now = Date.now()) {
  const { card: next, log } = schedule(card, rating, now);
  await db.transaction('rw', db.cards, db.reviews, db.days, async () => {
    await db.cards.put({ ...card, ...next });
    await db.reviews.add({ termId: card.termId, ...log });
    await bumpDay({ reviews: 1, newCards: card.state === 'new' ? 1 : 0 }, now);
  });
}

/**
 * Fila do dia: cartões vencidos até o fim do dia (revisão primeiro), mais
 * cartões novos até o limite diário. Passos curtos de aprendizagem que
 * vencem nos próximos 20 minutos entram no fim da fila.
 */
export function buildQueue(
  cards: CardRow[],
  newIntroducedToday: number,
  newPerDay: number,
  now = Date.now(),
) {
  const learnAhead = now + 20 * 60_000;
  const eod = endOfDay(now);
  const learning = cards
    .filter((c) => (c.state === 'learning' || c.state === 'relearning') && c.due <= learnAhead)
    .sort((a, b) => a.due - b.due);
  const review = cards
    .filter((c) => c.state === 'review' && c.due <= eod)
    .sort((a, b) => a.due - b.due);
  const fresh = cards
    .filter((c) => c.state === 'new')
    .sort((a, b) => a.addedAt - b.addedAt)
    .slice(0, Math.max(0, newPerDay - newIntroducedToday));
  return { learning, review, fresh, all: [...review, ...fresh, ...learning] };
}
