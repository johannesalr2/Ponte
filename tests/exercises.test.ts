import { describe, expect, it } from 'vitest';
import type { Term } from '../src/content/schema';
import {
  acceptedAnswers,
  buildSession,
  checkTyped,
  checkTypedTranslation,
  distractors,
  findInSentence,
  findTranslationInSentence,
  isCorrect,
  kindsFor,
  kindsOfFocus,
  makeExercise,
  maskAnswers,
  MODES,
  seeded,
  shuffle,
  type ExerciseContext,
} from '../src/lib/exercises';
import { fold } from '../src/lib/normalize';
import {
  pickPracticeTerms,
  recentMistakes,
  recommendMode,
  type CardLike,
  type PracticeOutcome,
} from '../src/lib/practice';
import { pickNewTerms } from '../src/lib/newTerms';
import { loadTerms } from './helpers';

const terms = loadTerms();
const im = terms.filter((t) => t.profession === 'industriemechaniker');
const tr = (t: Term) => t.tr['pt-BR']?.term ?? t.de.word;
const trEx = (t: Term, i: number) => t.examples[i]?.tr['pt-BR'] ?? '';
const byId = (id: string) => {
  const t = terms.find((x) => x.id === id);
  if (!t) throw new Error(id);
  return t;
};

describe('correção de respostas digitadas', () => {
  it('aceita resposta exata, sem diferenciar maiúsculas', () => {
    expect(checkTyped('Bügelmessschraube', 'Bügelmessschraube')).toBe('exact');
    expect(checkTyped('bügelmessschraube', 'Bügelmessschraube')).toBe('exact');
  });

  it('aceita sem trema ou com a grafia ae/oe/ue, avisando', () => {
    expect(checkTyped('Bugelmessschraube', 'Bügelmessschraube')).toBe('accent');
    expect(checkTyped('Buegelmessschraube', 'Bügelmessschraube')).toBe('accent');
    expect(checkTyped('Verschleiss', 'Verschleiß')).toBe('accent');
    expect(isCorrect('accent')).toBe(true);
  });

  it('aponta erro de digitação como quase-acerto (conta como erro)', () => {
    expect(checkTyped('Messchieber', 'Messschieber')).toBe('typo');
    expect(isCorrect('typo')).toBe(false);
  });

  it('confere o artigo quando o usuário escreve', () => {
    expect(checkTyped('der Messschieber', 'Messschieber', 'der')).toBe('exact');
    expect(checkTyped('die Messschieber', 'Messschieber', 'der')).toBe('wrong-article');
    expect(checkTyped('Messschieber', 'Messschieber', 'der')).toBe('exact');
  });

  it('recusa resposta errada', () => {
    expect(checkTyped('Hammer', 'Feile')).toBe('wrong');
  });
});

describe('frases com lacuna (cloze)', () => {
  it('acha o termo na forma flexionada', () => {
    const r = findInSentence(
      byId('im-schmieren'),
      'Die Führungen werden einmal pro Schicht geschmiert.',
    );
    expect(r?.gap).toBe('geschmiert');
    expect(r?.before).toBe('Die Führungen werden einmal pro Schicht ');
  });

  it('acha o plural e expressões com espaço', () => {
    expect(
      findInSentence(byId('im-lufteinschluss'), 'Lufteinschlüsse führen zu Fehlern.')?.gap,
    ).toBe('Lufteinschlüsse');
    expect(findInSentence(byId('fi-neu-starten'), 'Der Dienst muss neu starten.')?.gap).toBe(
      'neu starten',
    );
  });

  it('devolve null quando a palavra não aparece', () => {
    expect(findInSentence(byId('im-feile'), 'Das hat nichts damit zu tun.')).toBeNull();
  });

  it('a maioria dos termos tem um exemplo utilizável para lacuna', () => {
    const usable = terms.filter((t) => t.examples.some((e) => findInSentence(t, e.de)));
    expect(usable.length / terms.length).toBeGreaterThan(0.8);
  });
});

const ctx = (speech = false): ExerciseContext => ({
  tr,
  answers: (t) => {
    const x = t.tr['pt-BR'];
    return x ? acceptedAnswers(x.term, Object.values(x.variants ?? {})) : [];
  },
  trExample: trEx,
  simple: (t) => t.tr['pt-BR']?.simple ?? '',
  technical: (t) => t.tr['pt-BR']?.technical ?? '',
  speech,
});

describe('gerador de exercícios', () => {
  it('embaralha de forma determinística com semente', () => {
    expect(shuffle([1, 2, 3, 4, 5], seeded(1))).toEqual(shuffle([1, 2, 3, 4, 5], seeded(1)));
    expect(shuffle([1, 2, 3, 4, 5], seeded(1)).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('distratores são da mesma classe gramatical, sem repetir o termo nem traduções', () => {
    const term = byId('im-messschieber');
    const d = distractors(term, im, tr, 3, seeded(7));
    expect(d).toHaveLength(3);
    for (const x of d) {
      expect(x.id).not.toBe(term.id);
      expect(x.de.pos).toBe('noun');
    }
    expect(new Set(d.map(tr)).size).toBe(3);
  });

  it('der/die/das e plural só para substantivos', () => {
    expect(kindsFor(byId('im-schmieren'), ctx())).not.toContain('article');
    expect(kindsFor(byId('im-schmieren'), ctx())).not.toContain('plural');
    expect(kindsFor(byId('im-messuhr'), ctx())).toEqual(
      expect.arrayContaining(['article', 'plural']),
    );
    // plural igual ao singular não vira exercício de plural
    expect(kindsFor(byId('im-messschieber'), ctx())).not.toContain('plural');
  });

  it('exercícios de áudio só com suporte a voz', () => {
    expect(kindsFor(byId('im-feile'), ctx(false))).not.toContain('listen');
    expect(kindsFor(byId('im-feile'), ctx(false))).not.toContain('listen-pt');
    expect(kindsFor(byId('im-feile'), ctx(true))).toEqual(
      expect.arrayContaining(['listen', 'listen-pt']),
    );
  });

  it('múltipla escolha inclui a resposta certa entre 4 opções', () => {
    const ex = makeExercise('mc-de', byId('im-welle'), im, ctx(), seeded(3));
    expect(ex?.kind).toBe('mc-de');
    if (ex?.kind === 'mc-de') {
      expect(ex.options).toHaveLength(4);
      expect(ex.options.map((o) => o.id)).toContain('im-welle');
    }
  });

  it('"qual é o termo?" esconde a tradução dentro da explicação', () => {
    const ex = makeExercise('define', byId('pf-blutzucker'), terms, ctx(), seeded(2));
    expect(ex?.kind).toBe('define');
    if (ex?.kind === 'define') expect(fold(ex.definition)).not.toContain('glicemia');
  });

  it('monta uma sessão variada sem repetir o tipo em sequência', () => {
    const kinds = MODES.de.flatMap((m) => m.kinds);
    const session = buildSession(im, im, ctx(true), { size: 10, kinds, rng: seeded(42) });
    expect(session.length).toBeGreaterThanOrEqual(10);
    const used = session.map((e) => e.kind);
    expect(new Set(used).size).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < used.length; i++) {
      if (used[i] !== 'match' && used[i - 1] !== 'match') expect(used[i]).not.toBe(used[i - 1]);
    }
  });

  it('cada modo só usa os seus tipos e consegue 10 exercícios', () => {
    for (const focus of ['de', 'locale'] as const) {
      for (const { mode, kinds } of MODES[focus]) {
        const session = buildSession(im, im, ctx(true), { size: 10, kinds, rng: seeded(5) });
        expect(session.length, `${focus}:${mode}`).toBeGreaterThanOrEqual(10);
        expect(
          session.every((e) => kinds.includes(e.kind)),
          `${focus}:${mode}`,
        ).toBe(true);
      }
    }
  });

  it('inclui o exercício de pares mesmo quando o primeiro termo sorteado é verbo', () => {
    const verbs = im.filter((t) => t.de.pos === 'verb');
    const nouns = im.filter((t) => t.de.pos === 'noun');
    for (let seed = 0; seed < 20; seed++) {
      const session = buildSession([...verbs, ...nouns.slice(0, 8)], im, ctx(true), {
        size: 10,
        kinds: MODES.locale[0]?.kinds ?? [],
        rng: seeded(seed),
      });
      expect(
        session.some((e) => e.kind === 'match'),
        `semente ${seed}`,
      ).toBe(true);
    }
  });

  it('modo com só dois tipos não perde termos por repetir o tipo', () => {
    const nouns = im.filter((t) => t.de.article);
    const session = buildSession(nouns, im, ctx(), {
      size: 10,
      kinds: ['article'],
      rng: seeded(1),
    });
    expect(session).toHaveLength(10);
  });

  it('o foco em português não tem der/die/das; o foco em alemão não tem exercícios de explicação', () => {
    expect(kindsOfFocus('locale')).not.toContain('article');
    expect(kindsOfFocus('de')).not.toContain('explain');
    expect(kindsOfFocus('locale')).toEqual(
      expect.arrayContaining(['typing-pt', 'cloze-pt', 'define']),
    );
  });
});

describe('respostas em português', () => {
  it('aceita alternativas, parênteses e variantes', () => {
    const a = acceptedAnswers('isolamento (elétrico)');
    expect(a).toEqual(expect.arrayContaining(['isolamento', 'isolamento elétrico']));
    expect(acceptedAnswers('cateter / sonda')).toEqual(
      expect.arrayContaining(['cateter', 'sonda']),
    );
    expect(acceptedAnswers('micrômetro', ['micrómetro'])).toContain('micrómetro');
  });

  it('corrige ignorando artigo, maiúsculas e acentos', () => {
    const answers = acceptedAnswers('relógio comparador');
    expect(checkTypedTranslation('O relógio comparador', answers)).toBe('exact');
    expect(checkTypedTranslation('relogio comparador', answers)).toBe('accent');
    expect(checkTypedTranslation('relógio comparadr', answers)).toBe('typo');
    expect(checkTypedTranslation('paquímetro', answers)).toBe('wrong');
    expect(checkTypedTranslation('', answers)).toBe('wrong');
  });

  it('acha a tradução (inclusive no plural) numa frase em português', () => {
    const found = findTranslationInSentence(['paquímetro'], 'Use os paquímetros digitais.');
    expect(found?.gap).toBe('paquímetros');
    expect(findTranslationInSentence(['paquimetro'], 'Confira com o Paquímetro.')?.gap).toBe(
      'Paquímetro',
    );
    expect(findTranslationInSentence(['lima'], 'Limpe a bancada.')).toBeNull();
  });

  it('esconde a resposta em textos', () => {
    expect(maskAnswers('O torquímetro mede o torque.', ['torquímetro'])).toBe(
      'O ___ mede o torque.',
    );
  });

  it('boa parte dos termos tem frase em português para lacuna', () => {
    const c = ctx();
    const usable = terms.filter((t) => kindsFor(t, c).includes('cloze-pt'));
    expect(usable.length / terms.length).toBeGreaterThan(0.5);
  });
});

describe('seleção automática de termos', () => {
  const now = Date.UTC(2026, 9, 15);
  const base = {
    terms: im,
    level: 'B1' as const,
    eligible: () => true,
    size: 10,
    now,
    rng: seeded(9),
  };

  it('começa pelos erros recentes, sem os acertos posteriores', () => {
    const results: PracticeOutcome[] = [
      { termId: 'im-welle', correct: false, at: now - 1000 },
      { termId: 'im-feile', correct: false, at: now - 5000 },
      { termId: 'im-feile', correct: true, at: now - 100 },
      { termId: 'im-lager', correct: false, at: now - 30 * 86_400_000 },
    ];
    expect(recentMistakes(results, now)).toEqual(['im-welle']);
    const picked = pickPracticeTerms({ ...base, cards: [], results });
    expect(picked[0]?.id).toBe('im-welle');
    expect(picked).toHaveLength(10);
  });

  it('depois usa os cartões em estudo e respeita o filtro de elegibilidade', () => {
    const cards: CardLike[] = [
      { termId: 'im-messuhr', state: 'learning', stability: 1, lapses: 0 },
      { termId: 'im-schmieren', state: 'review', stability: 2, lapses: 3 },
    ];
    const nounsOnly = pickPracticeTerms({
      ...base,
      cards,
      results: [],
      eligible: (t) => t.de.pos === 'noun',
    });
    expect(nounsOnly.map((t) => t.id)).toContain('im-messuhr');
    expect(nounsOnly.map((t) => t.id)).not.toContain('im-schmieren');
    expect(nounsOnly.every((t) => t.de.pos === 'noun')).toBe(true);
    expect(new Set(nounsOnly.map((t) => t.id)).size).toBe(nounsOnly.length);
  });

  it('recomenda o modo de menor acerto, ou o primeiro sem histórico', () => {
    const modes = ['understand', 'recall', 'grammar'] as const;
    expect(recommendMode(modes, {})).toBe('understand');
    expect(
      recommendMode(modes, {
        understand: { correct: 9, total: 10, at: 1 },
        grammar: { correct: 4, total: 10, at: 1 },
      }),
    ).toBe('grammar');
  });
});

describe('introdução de termos novos', () => {
  it('prioriza o nível do usuário e ignora termos já em estudo', () => {
    const picks = pickNewTerms(im, new Set(['im-wartung']), 'A2', 5);
    expect(picks).toHaveLength(5);
    expect(picks.every((t) => t.level === 'A2')).toBe(true);
    expect(picks.map((t) => t.id)).not.toContain('im-wartung');
  });

  it('prefere níveis abaixo aos acima quando o nível acaba', () => {
    const picks = pickNewTerms(im, new Set(), 'B2', im.length);
    const levels = picks.map((t) => t.level);
    expect(levels.indexOf('B1')).toBeLessThan(levels.indexOf('C1'));
  });
});
