import { editDistance, searchKey, tokens, typoBudget } from './normalize';

/**
 * Busca sem acentos e tolerante a erros de digitação.
 * Cada documento tem campos com peso; a pontuação favorece correspondência
 * exata, depois prefixo, depois substring, depois distância de edição.
 */

export interface SearchField {
  text: string;
  weight: number;
  /** campos longos (explicações) só aceitam substring, sem tolerância a erros */
  fuzzy?: boolean;
}

export interface SearchDoc<T> {
  item: T;
  fields: SearchField[];
}

interface IndexedField {
  key: string;
  words: string[];
  weight: number;
  fuzzy: boolean;
}

export interface SearchIndex<T> {
  docs: { item: T; fields: IndexedField[] }[];
}

export interface SearchHit<T> {
  item: T;
  score: number;
}

export function buildIndex<T>(docs: SearchDoc<T>[]): SearchIndex<T> {
  return {
    docs: docs.map((d) => ({
      item: d.item,
      fields: d.fields
        .filter((f) => f.text)
        .map((f) => {
          const key = searchKey(f.text);
          return {
            key,
            words: key.split(' ').filter(Boolean),
            weight: f.weight,
            fuzzy: f.fuzzy ?? true,
          };
        }),
    })),
  };
}

/** pontuação de um termo da busca (q) contra uma palavra (w) — 0 se não combina */
function wordScore(q: string, w: string, fuzzy: boolean): number {
  if (w === q) return 100;
  if (w.startsWith(q)) return q.length >= 2 ? 80 - Math.min(20, w.length - q.length) : 0;
  if (q.length >= 3 && w.includes(q)) return 55;
  if (!fuzzy) return 0;
  const budget = typoBudget(q.length);
  if (budget === 0) return 0;
  const whole = editDistance(q, w, budget);
  if (whole <= budget) return 50 - whole * 12;
  // digitação incompleta com erro: compara com o início da palavra
  if (w.length > q.length) {
    const prefix = editDistance(q, w.slice(0, q.length), budget);
    if (prefix <= budget) return 40 - prefix * 12;
  }
  return 0;
}

function fieldScore(query: string, qWords: string[], field: IndexedField): number {
  if (field.key === query) return 120 * field.weight;
  if (field.key.startsWith(query) && query.length >= 2) return 95 * field.weight;
  // todas as palavras da busca precisam combinar com alguma palavra do campo
  let total = 0;
  for (const q of qWords) {
    let best = 0;
    for (const w of field.words) best = Math.max(best, wordScore(q, w, field.fuzzy));
    if (best === 0) {
      total = 0;
      break;
    }
    total += best;
  }
  const wordsScore = qWords.length ? (total / qWords.length) * field.weight : 0;
  // compostos alemães: "messschieber" contém "schieber"
  const compact = query.replace(/ /g, '');
  const compoundScore =
    compact.length >= 4 && field.key.replace(/ /g, '').includes(compact) ? 60 * field.weight : 0;
  return Math.max(wordsScore, compoundScore);
}

export function search<T>(index: SearchIndex<T>, rawQuery: string, limit = 50): SearchHit<T>[] {
  const query = searchKey(rawQuery);
  if (!query) return [];
  const qWords = tokens(rawQuery);
  const hits: SearchHit<T>[] = [];
  for (const doc of index.docs) {
    let score = 0;
    for (const f of doc.fields) score = Math.max(score, fieldScore(query, qWords, f));
    if (score > 0) hits.push({ item: doc.item, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
