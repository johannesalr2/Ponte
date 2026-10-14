import type { Article, Term } from '@/content/schema';
import { editDistance, fold } from './normalize';

/**
 * Gerador de exercícios. Funções puras: recebem os termos, uma função de
 * tradução (idioma de explicação) e um gerador aleatório (para testes
 * determinísticos).
 */

export type ExerciseKind =
  'mc-de' | 'mc-pt' | 'article' | 'plural' | 'cloze' | 'typing' | 'match' | 'listen';
export const EXERCISE_KINDS: readonly ExerciseKind[] = [
  'mc-de',
  'mc-pt',
  'article',
  'plural',
  'cloze',
  'typing',
  'match',
  'listen',
];

export type Translate = (term: Term) => string;
export type Rng = () => number;

export type Exercise =
  /** vê o alemão, escolhe a tradução */
  | { kind: 'mc-de'; term: Term; options: Term[] }
  /** vê a tradução, escolhe o alemão */
  | { kind: 'mc-pt'; term: Term; options: Term[] }
  | { kind: 'article'; term: Term }
  | { kind: 'plural'; term: Term }
  | {
      kind: 'cloze';
      term: Term;
      before: string;
      gap: string;
      after: string;
      translation: string;
      options: Term[];
    }
  | { kind: 'typing'; term: Term }
  | { kind: 'match'; terms: Term[]; right: Term[] }
  /** ouve o alemão, escolhe a tradução */
  | { kind: 'listen'; term: Term; options: Term[] };

/** Gerador pseudoaleatório com semente (mulberry32). */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/** Distratores: mesma classe gramatical, preferindo a mesma área, sem traduções repetidas. */
export function distractors(
  term: Term,
  pool: Term[],
  tr: Translate,
  count: number,
  rng: Rng,
): Term[] {
  const seen = new Set([fold(tr(term)), fold(term.de.word)]);
  const candidates = shuffle(
    pool.filter((t) => t.id !== term.id && t.de.pos === term.de.pos),
    rng,
  ).sort((a, b) => Number(b.area === term.area) - Number(a.area === term.area));
  const out: Term[] = [];
  for (const c of candidates) {
    const keys = [fold(tr(c)), fold(c.de.word)];
    if (keys.some((k) => seen.has(k))) continue;
    keys.forEach((k) => seen.add(k));
    out.push(c);
    if (out.length === count) break;
  }
  return out;
}

const WORD = /[\p{L}\p{N}-]+/gu;

/**
 * Procura o termo (ou uma forma flexionada dele) numa frase de exemplo.
 * Devolve o trecho antes, a lacuna e o trecho depois, ou null.
 */
export function findInSentence(
  term: Term,
  sentence: string,
): { before: string; gap: string; after: string } | null {
  const word = term.de.word.toLowerCase();
  if (word.includes(' ')) {
    const i = sentence.toLowerCase().indexOf(word);
    return i < 0
      ? null
      : {
          before: sentence.slice(0, i),
          gap: sentence.slice(i, i + word.length),
          after: sentence.slice(i + word.length),
        };
  }
  const forms = new Set([word, term.de.plural?.toLowerCase()].filter(Boolean) as string[]);
  // radical: verbos perdem -en/-n; substantivos aceitam terminações de caso (-s, -n, -en, -es)
  const stem = term.de.pos === 'verb' ? word.replace(/(en|n)$/, '') : word;
  for (const m of sentence.matchAll(WORD)) {
    const token = m[0];
    const lower = token.toLowerCase();
    const ok =
      forms.has(lower) ||
      (stem.length >= 4 &&
        (lower.startsWith(stem) || lower.startsWith(`ge${stem}`) || lower.endsWith(stem)) &&
        lower.length - stem.length <= 4);
    if (ok) {
      const i = m.index ?? 0;
      return { before: sentence.slice(0, i), gap: token, after: sentence.slice(i + token.length) };
    }
  }
  return null;
}

export type Verdict = 'exact' | 'accent' | 'typo' | 'wrong' | 'wrong-article';

/**
 * Corrige uma resposta digitada em alemão. Aceita sem acento/trema ("accent"),
 * aponta quase-acertos ("typo", conta como erro) e confere o artigo se o
 * usuário o escreveu.
 */
export function checkTyped(
  input: string,
  expected: string,
  article: Article | null = null,
): Verdict {
  let answer = input.trim().replace(/\s+/g, ' ');
  const m = /^(der|die|das)\s+(.+)$/i.exec(answer);
  if (m && article) {
    if (m[1]?.toLowerCase() !== article) return 'wrong-article';
    answer = m[2] ?? '';
  }
  if (answer === expected) return 'exact';
  if (answer.toLowerCase() === expected.toLowerCase()) return 'exact';
  const a = fold(answer);
  const b = fold(expected);
  if (a === b || a.replace(/ae|oe|ue/g, (x) => x[0] ?? '') === b) return 'accent';
  const max = b.length >= 6 ? 1 : 0;
  if (max && editDistance(a, b, max) <= max) return 'typo';
  return 'wrong';
}

export const isCorrect = (v: Verdict) => v === 'exact' || v === 'accent';

/** Quais tipos de exercício um termo permite. */
export function kindsFor(term: Term, speech: boolean): ExerciseKind[] {
  const kinds: ExerciseKind[] = ['mc-de', 'mc-pt', 'typing'];
  if (term.de.article) kinds.push('article');
  if (term.de.plural && term.de.plural !== term.de.word) kinds.push('plural');
  if (term.examples.some((e) => findInSentence(term, e.de))) kinds.push('cloze');
  if (speech) kinds.push('listen');
  return kinds;
}

export function makeExercise(
  kind: ExerciseKind,
  term: Term,
  pool: Term[],
  tr: Translate,
  trExample: (term: Term, i: number) => string,
  rng: Rng,
): Exercise | null {
  switch (kind) {
    case 'mc-de':
    case 'mc-pt':
    case 'listen': {
      const others = distractors(term, pool, tr, 3, rng);
      if (others.length < 2) return null;
      return { kind, term, options: shuffle([term, ...others], rng) };
    }
    case 'article':
      return term.de.article ? { kind, term } : null;
    case 'plural':
      return term.de.plural ? { kind, term } : null;
    case 'typing':
      return { kind, term };
    case 'cloze': {
      const idx = term.examples.findIndex((e) => findInSentence(term, e.de));
      const ex = term.examples[idx];
      const found = ex ? findInSentence(term, ex.de) : null;
      if (!found) return null;
      const others = distractors(term, pool, tr, 3, rng);
      if (others.length < 2) return null;
      return {
        kind,
        term,
        ...found,
        translation: trExample(term, idx),
        options: shuffle([term, ...others], rng),
      };
    }
    case 'match': {
      const others = distractors(term, pool, tr, 4, rng);
      if (others.length < 3) return null;
      const terms = shuffle([term, ...others], rng);
      return { kind, terms, right: shuffle(terms, rng) };
    }
  }
}

/**
 * Monta uma sessão variada: cada termo recebe um tipo diferente do anterior,
 * com um exercício de pares no meio quando possível.
 */
export function buildSession(
  terms: Term[],
  pool: Term[],
  tr: Translate,
  trExample: (term: Term, i: number) => string,
  opts: { size: number; speech: boolean; kinds?: readonly ExerciseKind[]; rng: Rng },
): Exercise[] {
  const allowed = new Set(opts.kinds ?? EXERCISE_KINDS);
  const out: Exercise[] = [];
  let last: ExerciseKind | null = null;
  const picks = shuffle(terms, opts.rng);
  for (const term of picks) {
    if (out.length >= opts.size) break;
    const kinds = shuffle(
      kindsFor(term, opts.speech).filter((k) => allowed.has(k) && k !== last),
      opts.rng,
    );
    for (const k of kinds) {
      const ex = makeExercise(k, term, pool, tr, trExample, opts.rng);
      if (ex) {
        out.push(ex);
        last = k;
        break;
      }
    }
  }
  if (allowed.has('match') && out.length >= 4 && picks[0]) {
    const match = makeExercise('match', picks[0], pool, tr, trExample, opts.rng);
    if (match) out.splice(Math.floor(out.length / 2), 0, match);
  }
  return out;
}
