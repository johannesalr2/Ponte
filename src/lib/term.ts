import type { Term } from '@/content/schema';

/** "der Messschieber" — texto falado/escrito com artigo quando houver. */
export function withArticle(term: Term): string {
  return term.de.article ? `${term.de.article} ${term.de.word}` : term.de.word;
}
