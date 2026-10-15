import type { Level, Term } from '@/content/schema';
import { shuffle, type PracticeMode, type Rng } from './exercises';
import { pickNewTerms } from './newTerms';

/**
 * Escolha automática dos termos de um treino e do modo recomendado.
 * Ordem: erros recentes → termos em estudo mais fracos → termos novos do nível.
 */

export interface PracticeOutcome {
  termId: string;
  correct: boolean;
  at: number;
}

export interface CardLike {
  termId: string;
  state: 'new' | 'learning' | 'review' | 'relearning';
  stability: number;
  lapses: number;
}

const DAY = 86_400_000;

/** Termos cujo último resultado nos exercícios (últimos `days` dias) foi erro, do mais recente ao mais antigo. */
export function recentMistakes(results: PracticeOutcome[], now: number, days = 14): string[] {
  const latest = new Map<string, PracticeOutcome>();
  for (const r of results) {
    if (r.at < now - days * DAY) continue;
    const prev = latest.get(r.termId);
    if (!prev || r.at > prev.at) latest.set(r.termId, r);
  }
  return [...latest.values()]
    .filter((r) => !r.correct)
    .sort((a, b) => b.at - a.at)
    .map((r) => r.termId);
}

/** Quanto mais fraco o cartão, menor o número: aprendendo primeiro, depois menor estabilidade e mais lapsos. */
function weakness(c: CardLike): number {
  const stage = c.state === 'review' ? 1 : 0;
  return stage * 1e6 + c.stability * 10 - c.lapses * 5;
}

export function pickPracticeTerms(opts: {
  terms: Term[];
  cards: CardLike[];
  results: PracticeOutcome[];
  level: Level;
  eligible: (t: Term) => boolean;
  size: number;
  now: number;
  rng: Rng;
}): Term[] {
  const byId = new Map(opts.terms.map((t) => [t.id, t]));
  const chosen: Term[] = [];
  const seen = new Set<string>();
  const add = (t: Term | undefined) => {
    if (!t || seen.has(t.id) || !opts.eligible(t) || chosen.length >= opts.size) return;
    seen.add(t.id);
    chosen.push(t);
  };

  // 1. até metade do treino com erros recentes
  recentMistakes(opts.results, opts.now)
    .slice(0, Math.ceil(opts.size / 2))
    .forEach((id) => add(byId.get(id)));

  // 2. termos em estudo, sorteados entre os mais fracos (para variar a cada treino)
  const weakest = opts.cards
    .filter((c) => byId.has(c.termId))
    .sort((a, b) => weakness(a) - weakness(b))
    .slice(0, opts.size * 3);
  shuffle(weakest, opts.rng).forEach((c) => add(byId.get(c.termId)));

  // 3. completa com termos novos do nível do usuário
  pickNewTerms(opts.terms.filter(opts.eligible), seen, opts.level, opts.size).forEach(add);
  return chosen;
}

export interface ModeStat {
  correct: number;
  total: number;
  at: number;
}

/**
 * Modo recomendado: o de menor acerto no último treino. Sem histórico,
 * recomenda o primeiro modo (o mais fácil).
 */
export function recommendMode(
  modes: readonly PracticeMode[],
  stats: Partial<Record<PracticeMode, ModeStat>>,
): PracticeMode | undefined {
  const played = modes.filter((m) => stats[m]?.total);
  if (!played.length) return modes[0];
  const pct = (m: PracticeMode) => {
    const s = stats[m];
    return s && s.total ? s.correct / s.total : 1;
  };
  return [...played].sort((a, b) => pct(a) - pct(b))[0];
}
