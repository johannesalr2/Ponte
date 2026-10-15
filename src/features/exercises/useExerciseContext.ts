import { useMemo } from 'react';
import { useI18n } from '@/content/locale';
import { acceptedAnswers, type ExerciseContext } from '@/lib/exercises';
import { speechSupported } from '@/lib/speech';

/** Liga o gerador de exercícios às traduções do idioma de explicação ativo. */
export function useExerciseContext(): ExerciseContext {
  const { termTr, pick } = useI18n();
  return useMemo(
    () => ({
      tr: (t) => termTr(t)?.term ?? t.de.word,
      answers: (t) => {
        const x = termTr(t);
        return x ? acceptedAnswers(x.term, Object.values(x.variants ?? {})) : [];
      },
      trExample: (t, i) => pick(t.examples[i]?.tr) ?? '',
      simple: (t) => termTr(t)?.simple ?? '',
      technical: (t) => termTr(t)?.technical ?? '',
      speech: speechSupported(),
    }),
    [termTr, pick],
  );
}
