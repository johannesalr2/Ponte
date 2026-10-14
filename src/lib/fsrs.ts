/**
 * FSRS-5 (Free Spaced Repetition Scheduler) — implementação própria e pura.
 *
 * Modelo de memória DSR: Dificuldade (1–10), Estabilidade (dias até a
 * recuperabilidade cair para 90%) e Recuperabilidade (probabilidade de
 * lembrar agora). Referência: https://github.com/open-spaced-repetition/fsrs4anki
 */

export type Rating = 1 | 2 | 3 | 4; // Errei, Difícil, Bom, Fácil
export const RATINGS: readonly Rating[] = [1, 2, 3, 4];

export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export interface FsrsCard {
  state: CardState;
  /** próxima revisão (ms desde epoch) */
  due: number;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  /** última revisão (ms) */
  lastReview: number | null;
  /** intervalo agendado em dias (0 para passos curtos) */
  scheduledDays: number;
}

export interface FsrsParams {
  w: readonly number[];
  requestRetention: number;
  maximumInterval: number;
  /** passos curtos em minutos */
  learningSteps: { again: number; hard: number; good: number };
  relearningStep: number;
}

/** Parâmetros padrão do FSRS-5. */
export const DEFAULT_WEIGHTS = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925,
  1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
] as const;

export const DEFAULT_PARAMS: FsrsParams = {
  w: DEFAULT_WEIGHTS,
  requestRetention: 0.9,
  maximumInterval: 36500,
  learningSteps: { again: 1, hard: 5, good: 10 },
  relearningStep: 10,
};

const DECAY = -0.5;
const FACTOR = 19 / 81; // garante R(S, S) = 0,9
const MINUTE = 60_000;
export const DAY = 86_400_000;

const w = (p: FsrsParams, i: number): number => p.w[i] ?? 0;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function newCard(now: number): FsrsCard {
  return {
    state: 'new',
    due: now,
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    lastReview: null,
    scheduledDays: 0,
  };
}

/** Probabilidade de lembrar depois de `elapsedDays` com estabilidade `stability`. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / stability, DECAY);
}

/** Intervalo (dias inteiros) para atingir a retenção desejada. */
export function nextInterval(stability: number, p: FsrsParams = DEFAULT_PARAMS): number {
  const ivl = (stability / FACTOR) * (Math.pow(p.requestRetention, 1 / DECAY) - 1);
  return clamp(Math.round(ivl), 1, p.maximumInterval);
}

export function initStability(g: Rating, p: FsrsParams = DEFAULT_PARAMS): number {
  return Math.max(w(p, g - 1), 0.1);
}

function rawInitDifficulty(g: Rating, p: FsrsParams): number {
  return w(p, 4) - Math.exp(w(p, 5) * (g - 1)) + 1;
}

export function initDifficulty(g: Rating, p: FsrsParams = DEFAULT_PARAMS): number {
  return clamp(rawInitDifficulty(g, p), 1, 10);
}

export function nextDifficulty(d: number, g: Rating, p: FsrsParams = DEFAULT_PARAMS): number {
  const delta = -w(p, 6) * (g - 3);
  const damped = d + (delta * (10 - d)) / 9; // amortecimento linear (FSRS-5)
  const reverted = w(p, 7) * rawInitDifficulty(4, p) + (1 - w(p, 7)) * damped; // reversão à média
  return clamp(reverted, 1, 10);
}

export function recallStability(
  d: number,
  s: number,
  r: number,
  g: Exclude<Rating, 1>,
  p: FsrsParams = DEFAULT_PARAMS,
): number {
  const hardPenalty = g === 2 ? w(p, 15) : 1;
  const easyBonus = g === 4 ? w(p, 16) : 1;
  const growth =
    Math.exp(w(p, 8)) *
    (11 - d) *
    Math.pow(s, -w(p, 9)) *
    (Math.exp(w(p, 10) * (1 - r)) - 1) *
    hardPenalty *
    easyBonus;
  return s * (1 + growth);
}

export function forgetStability(d: number, s: number, r: number, p: FsrsParams = DEFAULT_PARAMS) {
  const sf =
    w(p, 11) *
    Math.pow(d, -w(p, 12)) *
    (Math.pow(s + 1, w(p, 13)) - 1) *
    Math.exp(w(p, 14) * (1 - r));
  return Math.max(0.1, Math.min(sf, s));
}

/** Estabilidade após revisão no mesmo dia (FSRS-5). */
export function shortTermStability(s: number, g: Rating, p: FsrsParams = DEFAULT_PARAMS): number {
  return Math.max(0.1, s * Math.exp(w(p, 17) * (g - 3 + w(p, 18))));
}

export interface ReviewLog {
  rating: Rating;
  state: CardState;
  reviewedAt: number;
  elapsedDays: number;
  scheduledDays: number;
}

function inMinutes(card: FsrsCard, now: number, minutes: number, state: CardState): FsrsCard {
  return { ...card, state, due: now + minutes * MINUTE, scheduledDays: 0 };
}

function inDays(card: FsrsCard, now: number, days: number): FsrsCard {
  return { ...card, state: 'review', due: now + days * DAY, scheduledDays: days };
}

/** Calcula o resultado das quatro notas sem alterar o cartão. */
export function preview(
  card: FsrsCard,
  now: number,
  p: FsrsParams = DEFAULT_PARAMS,
): Record<Rating, FsrsCard> {
  const base = { ...card, reps: card.reps + 1, lastReview: now };
  const steps = p.learningSteps;

  if (card.state === 'new') {
    const next = (g: Rating): FsrsCard => ({
      ...base,
      stability: initStability(g, p),
      difficulty: initDifficulty(g, p),
    });
    const easy = next(4);
    return {
      1: inMinutes(next(1), now, steps.again, 'learning'),
      2: inMinutes(next(2), now, steps.hard, 'learning'),
      3: inMinutes(next(3), now, steps.good, 'learning'),
      4: inDays(easy, now, nextInterval(easy.stability, p)),
    };
  }

  const elapsedDays = card.lastReview === null ? 0 : (now - card.lastReview) / DAY;

  if (card.state === 'learning' || card.state === 'relearning') {
    const next = (g: Rating): FsrsCard => ({
      ...base,
      stability: shortTermStability(card.stability, g, p),
      difficulty: nextDifficulty(card.difficulty, g, p),
    });
    const good = next(3);
    const easy = next(4);
    const goodIvl = nextInterval(good.stability, p);
    const easyIvl = Math.max(nextInterval(easy.stability, p), goodIvl + 1);
    return {
      1: inMinutes(
        next(1),
        now,
        card.state === 'learning' ? steps.again : p.relearningStep,
        card.state,
      ),
      2: inMinutes(
        next(2),
        now,
        card.state === 'learning' ? steps.hard : p.relearningStep,
        card.state,
      ),
      3: inDays(good, now, goodIvl),
      4: inDays(easy, now, easyIvl),
    };
  }

  // revisão
  const r = retrievability(elapsedDays, card.stability);
  const sameDay = elapsedDays < 1;
  const success = (g: Exclude<Rating, 1>): FsrsCard => ({
    ...base,
    difficulty: nextDifficulty(card.difficulty, g, p),
    stability: sameDay
      ? shortTermStability(card.stability, g, p)
      : recallStability(card.difficulty, card.stability, r, g, p),
  });
  const again: FsrsCard = {
    ...base,
    lapses: card.lapses + 1,
    difficulty: nextDifficulty(card.difficulty, 1, p),
    stability: forgetStability(card.difficulty, card.stability, r, p),
  };
  const hard = success(2);
  const good = success(3);
  const easy = success(4);
  let hardIvl = nextInterval(hard.stability, p);
  let goodIvl = nextInterval(good.stability, p);
  hardIvl = Math.min(hardIvl, goodIvl);
  goodIvl = Math.max(goodIvl, hardIvl + 1);
  const easyIvl = Math.max(nextInterval(easy.stability, p), goodIvl + 1);
  return {
    1: inMinutes(again, now, p.relearningStep, 'relearning'),
    2: inDays(hard, now, hardIvl),
    3: inDays(good, now, goodIvl),
    4: inDays(easy, now, easyIvl),
  };
}

export function schedule(
  card: FsrsCard,
  rating: Rating,
  now: number,
  p: FsrsParams = DEFAULT_PARAMS,
): { card: FsrsCard; log: ReviewLog } {
  const next = preview(card, now, p)[rating];
  return {
    card: next,
    log: {
      rating,
      state: card.state,
      reviewedAt: now,
      elapsedDays: card.lastReview === null ? 0 : (now - card.lastReview) / DAY,
      scheduledDays: next.scheduledDays,
    },
  };
}

/** Texto curto do intervalo para os botões ("1 min", "10 min", "3 d", "2 m", "1,5 a"). */
export function formatInterval(
  card: FsrsCard,
  now: number,
): { value: number; unit: 'min' | 'h' | 'd' | 'mo' | 'y' } {
  const ms = Math.max(0, card.due - now);
  const minutes = Math.round(ms / MINUTE);
  if (minutes < 60) return { value: Math.max(1, minutes), unit: 'min' };
  if (minutes < 60 * 24) return { value: Math.round(minutes / 60), unit: 'h' };
  const days = Math.round(ms / DAY);
  if (days < 31) return { value: days, unit: 'd' };
  if (days < 365) return { value: Math.round(days / 30), unit: 'mo' };
  return { value: Math.round((days / 365) * 10) / 10, unit: 'y' };
}
