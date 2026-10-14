import { useMemo } from 'react';
import { useI18n } from '@/content/locale';
import type { Term } from '@/content/schema';
import { buildIndex, type SearchIndex } from '@/lib/search';

/** Índice de busca nos dois idiomas (alemão e idioma de explicação). */
export function useTermIndex(terms: Term[] | undefined): SearchIndex<Term> | undefined {
  const { termTr } = useI18n();
  return useMemo(() => {
    if (!terms) return undefined;
    return buildIndex(
      terms.map((t) => {
        const tr = termTr(t);
        return {
          item: t,
          fields: [
            { text: t.de.word, weight: 1 },
            { text: t.de.plural ?? '', weight: 0.9 },
            { text: t.synonyms.join(' '), weight: 0.85 },
            { text: tr?.term ?? '', weight: 1 },
            { text: Object.values(tr?.variants ?? {}).join(' '), weight: 0.9 },
            { text: tr?.technical ?? '', weight: 0.35, fuzzy: false },
            { text: tr?.simple ?? '', weight: 0.3, fuzzy: false },
          ],
        };
      }),
    );
  }, [terms, termTr]);
}
