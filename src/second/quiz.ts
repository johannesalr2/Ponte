import { shuffle, type Rng } from '@/lib/exercises';

export interface QuizItem {
  uri: string;
  learn: string;
  know: string;
}

export interface QuizQuestion {
  item: QuizItem;
  /** true: mostra no idioma aprendido e pede a tradução no idioma que a pessoa fala */
  fromLearn: boolean;
  prompt: string;
  answer: string;
  options: string[];
}

/**
 * Monta perguntas de múltipla escolha com rótulos da ESCO nos dois idiomas,
 * alternando a direção. As alternativas erradas vêm da mesma profissão
 * (parecidas entre si, então o exercício não fica óbvio).
 */
export function buildQuiz(items: QuizItem[], rng: Rng, size = 10): QuizQuestion[] {
  const usable = dedupe(items);
  if (usable.length < 4) return [];
  return shuffle(usable, rng)
    .slice(0, size)
    .map((item, i) => {
      const fromLearn = i % 2 === 0;
      const side = (x: QuizItem) => (fromLearn ? x.know : x.learn);
      const answer = side(item);
      const wrong = shuffle(
        usable.filter((x) => x !== item && side(x) !== answer),
        rng,
      )
        .map(side)
        .filter((v, j, all) => all.indexOf(v) === j)
        .slice(0, 3);
      return {
        item,
        fromLearn,
        prompt: fromLearn ? item.learn : item.know,
        answer,
        options: shuffle([answer, ...wrong], rng),
      };
    });
}

/** Tira itens repetidos ou sem tradução de verdade (mesmo texto nos dois idiomas). */
function dedupe(items: QuizItem[]): QuizItem[] {
  const seen = new Set<string>();
  return items.filter((x) => {
    const k = `${x.learn}\u0000${x.know}`;
    if (!x.learn || !x.know || x.learn === x.know || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
