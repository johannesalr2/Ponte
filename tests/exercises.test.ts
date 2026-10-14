import { describe, expect, it } from 'vitest';
import type { Term } from '../src/content/schema';
import {
  buildSession,
  checkTyped,
  distractors,
  findInSentence,
  isCorrect,
  kindsFor,
  makeExercise,
  seeded,
  shuffle,
} from '../src/lib/exercises';
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
    expect(kindsFor(byId('im-schmieren'), false)).not.toContain('article');
    expect(kindsFor(byId('im-schmieren'), false)).not.toContain('plural');
    expect(kindsFor(byId('im-messuhr'), false)).toEqual(
      expect.arrayContaining(['article', 'plural']),
    );
    // plural igual ao singular não vira exercício de plural
    expect(kindsFor(byId('im-messschieber'), false)).not.toContain('plural');
  });

  it('"ouvir e escolher" só com suporte a voz', () => {
    expect(kindsFor(byId('im-feile'), false)).not.toContain('listen');
    expect(kindsFor(byId('im-feile'), true)).toContain('listen');
  });

  it('múltipla escolha inclui a resposta certa entre 4 opções', () => {
    const ex = makeExercise('mc-de', byId('im-welle'), im, tr, trEx, seeded(3));
    expect(ex?.kind).toBe('mc-de');
    if (ex?.kind === 'mc-de') {
      expect(ex.options).toHaveLength(4);
      expect(ex.options.map((o) => o.id)).toContain('im-welle');
    }
  });

  it('monta uma sessão variada sem repetir o tipo em sequência', () => {
    const session = buildSession(im, im, tr, trEx, { size: 10, speech: true, rng: seeded(42) });
    expect(session.length).toBeGreaterThanOrEqual(10);
    const kinds = session.map((e) => e.kind);
    expect(new Set(kinds).size).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < kinds.length; i++) {
      if (kinds[i] !== 'match' && kinds[i - 1] !== 'match') expect(kinds[i]).not.toBe(kinds[i - 1]);
    }
  });

  it('respeita os tipos escolhidos', () => {
    const session = buildSession(im, im, tr, trEx, {
      size: 8,
      speech: false,
      kinds: ['article'],
      rng: seeded(1),
    });
    expect(session.every((e) => e.kind === 'article')).toBe(true);
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
