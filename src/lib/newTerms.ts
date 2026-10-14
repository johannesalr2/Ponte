import { LEVELS } from '@/content/constants';
import type { Level, Term } from '@/content/schema';

/** Ordem de introdução de termos novos: nível do usuário primeiro, depois os vizinhos. */
export function pickNewTerms(
  terms: Term[],
  carded: Set<string>,
  userLevel: Level,
  count: number,
): Term[] {
  const lvl = LEVELS.indexOf(userLevel);
  const distance = (t: Term) => {
    const d = LEVELS.indexOf(t.level) - lvl;
    return d <= 0 ? -d : d + 0.5; // prefere níveis abaixo do usuário aos acima
  };
  return terms
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => !carded.has(t.id))
    .sort((a, b) => distance(a.t) - distance(b.t) || a.i - b.i)
    .slice(0, Math.max(0, count))
    .map(({ t }) => t);
}
