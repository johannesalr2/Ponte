import type { Article, Term } from '@/content/schema';
import { editDistance, fold } from './normalize';

/**
 * Gerador de exercícios. Funções puras: recebem os termos, um contexto com as
 * traduções do idioma de explicação e um gerador aleatório (para testes
 * determinísticos).
 *
 * O "idioma em foco" decide o que é pergunta e o que é resposta:
 * - foco `de`: o usuário quer produzir o alemão (sabe o português);
 * - foco `locale`: o usuário quer produzir o termo no idioma de explicação
 *   (já sabe o alemão e precisa explicar em português).
 */

export type Focus = 'de' | 'locale';

export type ExerciseKind =
  /** vê o alemão, escolhe a tradução */
  | 'mc-de'
  /** vê a tradução, escolhe o alemão */
  | 'mc-pt'
  | 'article'
  | 'plural'
  /** frase em alemão com lacuna */
  | 'cloze'
  /** vê a tradução, escreve o alemão */
  | 'typing'
  | 'match'
  /** ouve o alemão, escolhe a tradução */
  | 'listen'
  /** ouve a tradução, escolhe o alemão */
  | 'listen-pt'
  /** frase no idioma de explicação com lacuna */
  | 'cloze-pt'
  /** vê o alemão, escreve a tradução */
  | 'typing-pt'
  /** vê o alemão, escolhe a explicação simples */
  | 'explain'
  /** lê a explicação técnica, escolhe o termo traduzido */
  | 'define';

export type PracticeMode = 'understand' | 'recall' | 'grammar' | 'explain';

/** Os três estilos de prática de cada foco e os tipos de exercício de cada um. */
export const MODES: Record<
  Focus,
  readonly { mode: PracticeMode; kinds: readonly ExerciseKind[] }[]
> = {
  de: [
    { mode: 'understand', kinds: ['mc-de', 'listen', 'match'] },
    { mode: 'recall', kinds: ['mc-pt', 'cloze', 'typing'] },
    { mode: 'grammar', kinds: ['article', 'plural'] },
  ],
  locale: [
    { mode: 'understand', kinds: ['mc-pt', 'listen-pt', 'match'] },
    { mode: 'recall', kinds: ['mc-de', 'cloze-pt', 'typing-pt'] },
    { mode: 'explain', kinds: ['explain', 'define'] },
  ],
};

/** Todos os tipos disponíveis num foco (para o "Personalizar"). */
export const kindsOfFocus = (focus: Focus): ExerciseKind[] => [
  ...new Set(MODES[focus].flatMap((m) => m.kinds)),
];

export type Rng = () => number;

/** Acesso às traduções do idioma de explicação, injetado pela interface. */
export interface ExerciseContext {
  /** tradução principal, como aparece no glossário */
  tr: (term: Term) => string;
  /** respostas aceitas ao escrever a tradução (sem parênteses, alternativas, variantes) */
  answers: (term: Term) => string[];
  trExample: (term: Term, i: number) => string;
  simple: (term: Term) => string;
  technical: (term: Term) => string;
  speech: boolean;
}

type Gap = { before: string; gap: string; after: string };

export type Exercise =
  | { kind: 'mc-de' | 'mc-pt' | 'listen' | 'listen-pt' | 'explain'; term: Term; options: Term[] }
  | { kind: 'article' | 'plural' | 'typing' | 'typing-pt'; term: Term }
  | ({ kind: 'cloze' | 'cloze-pt'; term: Term; translation: string; options: Term[] } & Gap)
  | { kind: 'define'; term: Term; definition: string; options: Term[] }
  | { kind: 'match'; terms: Term[]; right: Term[] };

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

/**
 * Formas aceitas de uma tradução: "cateter / sonda" aceita as duas;
 * "isolamento (elétrico)" aceita "isolamento" e "isolamento elétrico".
 */
export function acceptedAnswers(term: string, variants: string[] = []): string[] {
  const out = new Set<string>();
  for (const raw of [term, ...variants]) {
    for (const alt of raw.split(/\s*\/\s*/)) {
      const without = alt.replace(/\s*\([^)]*\)/g, '').trim();
      const inline = alt.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
      if (without) out.add(without);
      if (inline) out.add(inline);
    }
  }
  return [...out];
}

/** Distratores: mesma classe gramatical, preferindo a mesma área, sem traduções repetidas. */
export function distractors(
  term: Term,
  pool: Term[],
  tr: (t: Term) => string,
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
 * Procura o termo alemão (ou uma forma flexionada dele) numa frase de exemplo.
 * Devolve o trecho antes, a lacuna e o trecho depois, ou null.
 */
export function findInSentence(term: Term, sentence: string): Gap | null {
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

/** Minúsculas sem acento, caractere a caractere (mantém as posições do texto original). */
function foldKeepLength(s: string): string {
  return [...s]
    .map((c) => c.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().slice(0, 1) || c)
    .join('');
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Procura uma das traduções aceitas numa frase do idioma de explicação,
 * ignorando acentos e aceitando plural simples (-s, -es).
 */
export function findTranslationInSentence(answers: string[], sentence: string): Gap | null {
  if ([...sentence].length !== sentence.length) return null; // evita desalinhar posições
  const hay = foldKeepLength(sentence);
  const sorted = [...answers].sort((a, b) => b.length - a.length);
  for (const answer of sorted) {
    const needle = foldKeepLength(answer);
    if (needle.length < 3) continue;
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(needle)}(?:s|es)?(?![\\p{L}\\p{N}])`, 'u');
    const m = re.exec(hay);
    if (m) {
      const i = m.index;
      const end = i + m[0].length;
      return {
        before: sentence.slice(0, i),
        gap: sentence.slice(i, end),
        after: sentence.slice(end),
      };
    }
  }
  return null;
}

/** Esconde a tradução dentro de uma explicação, para não entregar a resposta. */
export function maskAnswers(text: string, answers: string[]): string {
  let out = text;
  for (const answer of [...answers].sort((a, b) => b.length - a.length)) {
    for (;;) {
      const found = findTranslationInSentence([answer], out);
      if (!found) break;
      out = `${found.before}___${found.after}`;
    }
  }
  return out;
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

/**
 * Corrige uma tradução digitada (idioma de explicação). Ignora artigo inicial
 * (o, a, os, as, um, uma) e aceita qualquer forma de `acceptedAnswers`.
 */
export function checkTypedTranslation(input: string, answers: string[]): Verdict {
  const answer = input
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(o|a|os|as|um|uma)\s+/i, '');
  if (!answer) return 'wrong';
  if (answers.some((x) => x.toLowerCase() === answer.toLowerCase())) return 'exact';
  const a = fold(answer);
  if (answers.some((x) => fold(x) === a)) return 'accent';
  if (answers.some((x) => fold(x).length >= 6 && editDistance(a, fold(x), 1) <= 1)) return 'typo';
  return 'wrong';
}

export const isCorrect = (v: Verdict) => v === 'exact' || v === 'accent';

/** Quais tipos de exercício um termo permite. */
export function kindsFor(term: Term, ctx: ExerciseContext): ExerciseKind[] {
  const kinds: ExerciseKind[] = ['mc-de', 'mc-pt', 'typing', 'typing-pt'];
  if (ctx.simple(term)) kinds.push('explain');
  if (ctx.technical(term)) kinds.push('define');
  if (term.de.article) kinds.push('article');
  if (term.de.plural && term.de.plural !== term.de.word) kinds.push('plural');
  if (term.examples.some((e) => findInSentence(term, e.de))) kinds.push('cloze');
  const answers = ctx.answers(term);
  if (term.examples.some((_, i) => findTranslationInSentence(answers, ctx.trExample(term, i)))) {
    kinds.push('cloze-pt');
  }
  if (ctx.speech) kinds.push('listen', 'listen-pt');
  return kinds;
}

export function makeExercise(
  kind: ExerciseKind,
  term: Term,
  pool: Term[],
  ctx: ExerciseContext,
  rng: Rng,
): Exercise | null {
  const withOptions = () => {
    const others = distractors(term, pool, ctx.tr, 3, rng);
    return others.length < 2 ? null : shuffle([term, ...others], rng);
  };
  switch (kind) {
    case 'mc-de':
    case 'mc-pt':
    case 'listen':
    case 'listen-pt':
    case 'explain': {
      const options = withOptions();
      return options ? { kind, term, options } : null;
    }
    case 'define': {
      const options = withOptions();
      const definition = maskAnswers(ctx.technical(term), ctx.answers(term));
      return options && definition ? { kind, term, definition, options } : null;
    }
    case 'article':
      return term.de.article ? { kind, term } : null;
    case 'plural':
      return term.de.plural ? { kind, term } : null;
    case 'typing':
    case 'typing-pt':
      return { kind, term };
    case 'cloze': {
      const idx = term.examples.findIndex((e) => findInSentence(term, e.de));
      const ex = term.examples[idx];
      const found = ex ? findInSentence(term, ex.de) : null;
      const options = found ? withOptions() : null;
      if (!found || !options) return null;
      return { kind, term, ...found, translation: ctx.trExample(term, idx), options };
    }
    case 'cloze-pt': {
      const answers = ctx.answers(term);
      const idx = term.examples.findIndex((_, i) =>
        findTranslationInSentence(answers, ctx.trExample(term, i)),
      );
      const found = idx >= 0 ? findTranslationInSentence(answers, ctx.trExample(term, idx)) : null;
      const options = found ? withOptions() : null;
      if (!found || !options) return null;
      return { kind, term, ...found, translation: term.examples[idx]?.de ?? '', options };
    }
    case 'match': {
      const others = distractors(term, pool, ctx.tr, 4, rng);
      if (others.length < 3) return null;
      const terms = shuffle([term, ...others], rng);
      return { kind, terms, right: shuffle(terms, rng) };
    }
  }
}

/** Termos citados num exercício (para registrar acertos e erros por termo). */
export function exerciseTerms(ex: Exercise): Term[] {
  return ex.kind === 'match' ? ex.terms : [ex.term];
}

/**
 * Monta uma sessão variada: evita repetir o tipo anterior quando possível,
 * com um exercício de pares no meio quando ele faz parte do modo.
 */
export function buildSession(
  terms: Term[],
  pool: Term[],
  ctx: ExerciseContext,
  opts: { size: number; kinds: readonly ExerciseKind[]; rng: Rng },
): Exercise[] {
  const allowed = new Set(opts.kinds);
  const out: Exercise[] = [];
  let last: ExerciseKind | null = null;
  const picks = shuffle(terms, opts.rng);
  for (const term of picks) {
    if (out.length >= opts.size) break;
    const possible = shuffle(
      kindsFor(term, ctx).filter((k) => allowed.has(k) && k !== 'match'),
      opts.rng,
    ).sort((a, b) => Number(a === last) - Number(b === last));
    for (const k of possible) {
      const ex = makeExercise(k, term, pool, ctx, opts.rng);
      if (ex) {
        out.push(ex);
        last = k;
        break;
      }
    }
  }
  if (allowed.has('match') && out.length >= 4) {
    // o primeiro termo que tenha distratores suficientes (verbos às vezes não têm)
    for (const term of picks) {
      const match = makeExercise('match', term, pool, ctx, opts.rng);
      if (match) {
        out.splice(Math.floor(out.length / 2), 0, match);
        break;
      }
    }
  }
  return out;
}

/** O termo serve para algum exercício destes tipos? */
export function eligibleFor(kinds: readonly ExerciseKind[], ctx: ExerciseContext) {
  const set = new Set(kinds);
  return (term: Term) => set.has('match') || kindsFor(term, ctx).some((k) => set.has(k));
}
