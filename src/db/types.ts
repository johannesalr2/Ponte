import type { Level } from '@/content/schema';
import type { ExerciseKind, Focus, PracticeMode } from '@/lib/exercises';
import type { FsrsCard, Rating } from '@/lib/fsrs';
import type { ModeStat } from '@/lib/practice';

export const GOALS = ['ausbildung', 'trabalho', 'reconhecimento'] as const;
export type Goal = (typeof GOALS)[number];

/** Perfil do onboarding. Nunca guarda empresa, nacionalidade ou origem. */
export interface Profile {
  profession: string;
  industry: string | null;
  level: Level;
  goal: Goal;
  locale: string;
  createdAt: number;
}

export type ThemePref = 'system' | 'light' | 'dark';

export interface Prefs {
  theme: ThemePref;
  newPerDay: number;
  explanation: 'technical' | 'simple';
  showVariant: boolean;
  /** idioma que o usuário quer produzir: alemão ou o idioma de explicação */
  focus: Focus;
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'system',
  newPerDay: 10,
  explanation: 'technical',
  showVariant: true,
  focus: 'de',
};

/** Último resultado de cada modo de prática, por foco (chave "de:grammar"). */
export type PracticeStats = Partial<Record<`${Focus}:${PracticeMode}`, ModeStat>>;

export type SettingRow =
  | { key: 'profile'; value: Profile }
  | { key: 'prefs'; value: Prefs }
  | { key: 'practiceStats'; value: PracticeStats };

/** Resultado de um termo num exercício (para "erros recentes"). */
export interface PracticeRow {
  id?: number;
  termId: string;
  kind: ExerciseKind;
  correct: boolean;
  at: number;
}

export interface CardRow extends FsrsCard {
  termId: string;
  profession: string;
  addedAt: number;
}

export interface ReviewRow {
  id?: number;
  termId: string;
  rating: Rating;
  state: FsrsCard['state'];
  reviewedAt: number;
  elapsedDays: number;
  scheduledDays: number;
}

/** Atividade de um dia local (AAAA-MM-DD): base do mapa de calor e da sequência. */
export interface DayRow {
  date: string;
  reviews: number;
  newCards: number;
  exercises: number;
  correct: number;
}

/** Texto em alemão (`de`) e no idioma de explicação do usuário (`pt`). */
export interface Bilingual {
  de: string;
  pt: string;
}

export interface CvEntry {
  id: string;
  from: string;
  to: string;
  title: Bilingual;
  place: string;
  details: Bilingual;
}

export interface CvRow {
  id: 'main';
  name: string;
  email: string;
  phone: string;
  city: string;
  profile: Bilingual;
  experience: CvEntry[];
  education: CvEntry[];
  skills: string[]; // ids de termos
  languages: { name: Bilingual; level: Bilingual }[];
  updatedAt: number;
}
