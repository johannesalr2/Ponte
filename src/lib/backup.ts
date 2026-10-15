import { z } from 'zod';
import { GOALS } from '@/db/types';
import { LEVELS } from '@/content/schema';
import type { PonteDB } from '@/db/db';
import type { PracticeRow, SettingRow } from '@/db/types';

/**
 * Backup manual: exporta todo o progresso local num JSON e importa de volta,
 * validando com Zod antes de gravar (um arquivo inválido não apaga nada).
 */

export const BACKUP_FORMAT = 'ponte-tecnica-backup';
export const BACKUP_VERSION = 1;

const state = z.enum(['new', 'learning', 'review', 'relearning']);
const rating = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const bilingual = z.object({ de: z.string(), pt: z.string() });

const profile = z.object({
  profession: z.string(),
  industry: z.string().nullable(),
  level: z.enum(LEVELS),
  goal: z.enum(GOALS),
  locale: z.string(),
  createdAt: z.number(),
});
const prefs = z.object({
  theme: z.enum(['system', 'light', 'dark']),
  newPerDay: z.number().int().min(0).max(200),
  explanation: z.enum(['technical', 'simple']),
  showVariant: z.boolean(),
  focus: z.enum(['de', 'locale']).default('de'),
});
const modeStat = z.object({
  correct: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  at: z.number(),
});

const entry = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  title: bilingual,
  place: z.string(),
  details: bilingual,
});

export const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  settings: z.array(
    z.discriminatedUnion('key', [
      z.object({ key: z.literal('profile'), value: profile }),
      z.object({ key: z.literal('prefs'), value: prefs }),
      z.object({ key: z.literal('practiceStats'), value: z.record(z.string(), modeStat) }),
    ]),
  ),
  cards: z.array(
    z.object({
      termId: z.string(),
      profession: z.string(),
      addedAt: z.number(),
      state,
      due: z.number(),
      stability: z.number().nonnegative(),
      difficulty: z.number().min(0).max(10),
      reps: z.number().int().nonnegative(),
      lapses: z.number().int().nonnegative(),
      lastReview: z.number().nullable(),
      scheduledDays: z.number().nonnegative(),
    }),
  ),
  reviews: z.array(
    z.object({
      id: z.number().optional(),
      termId: z.string(),
      rating,
      state,
      reviewedAt: z.number(),
      elapsedDays: z.number(),
      scheduledDays: z.number(),
    }),
  ),
  days: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      reviews: z.number().int().nonnegative(),
      newCards: z.number().int().nonnegative(),
      exercises: z.number().int().nonnegative(),
      correct: z.number().int().nonnegative(),
    }),
  ),
  practice: z
    .array(
      z.object({
        id: z.number().optional(),
        termId: z.string(),
        kind: z.string(),
        correct: z.boolean(),
        at: z.number(),
      }),
    )
    .default([]),
  cv: z.array(
    z.object({
      id: z.literal('main'),
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      city: z.string(),
      profile: bilingual,
      experience: z.array(entry),
      education: z.array(entry),
      skills: z.array(z.string()),
      languages: z.array(z.object({ name: bilingual, level: bilingual })),
      updatedAt: z.number(),
    }),
  ),
});

export type Backup = z.infer<typeof backupSchema>;

export async function exportBackup(db: PonteDB): Promise<Backup> {
  const [settings, cards, reviews, days, practice, cv] = await Promise.all([
    db.settings.toArray(),
    db.cards.toArray(),
    db.reviews.toArray(),
    db.days.toArray(),
    db.practice.toArray(),
    db.cv.toArray(),
  ]);
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    cards,
    reviews,
    days,
    practice,
    cv,
  };
}

export type ImportResult =
  { ok: true; cards: number; reviews: number } | { ok: false; error: string };

/** Valida e substitui todo o progresso local pelo conteúdo do backup. */
export async function importBackup(db: PonteDB, raw: unknown): Promise<ImportResult> {
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue ? `${issue.path.join('.')}: ${issue.message}` : 'invalid' };
  }
  const data = parsed.data;
  await db.transaction(
    'rw',
    [db.settings, db.cards, db.reviews, db.days, db.practice, db.cv],
    async () => {
      await Promise.all([
        db.settings.clear(),
        db.cards.clear(),
        db.reviews.clear(),
        db.days.clear(),
        db.practice.clear(),
        db.cv.clear(),
      ]);
      await db.cards.bulkPut(data.cards);
      await db.reviews.bulkPut(data.reviews);
      await db.days.bulkPut(data.days);
      await db.practice.bulkPut(data.practice as PracticeRow[]);
      await db.settings.bulkPut(data.settings as SettingRow[]);
      await db.cv.bulkPut(data.cv);
    },
  );
  return { ok: true, cards: data.cards.length, reviews: data.reviews.length };
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
