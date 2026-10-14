import type { Level } from '@/content/schema';
import type { FsrsCard, Rating } from '@/lib/fsrs';

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
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'system',
  newPerDay: 10,
  explanation: 'technical',
  showVariant: true,
};

export type SettingRow = { key: 'profile'; value: Profile } | { key: 'prefs'; value: Prefs };

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
