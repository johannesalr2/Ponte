import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MIN_TERMS_PER_PROFESSION } from '../src/content/config';
import { validateContent } from '../src/content/validate';
import { readContentDir } from '../scripts/read-content';

const files = readContentDir(fileURLToPath(new URL('../content', import.meta.url)));

describe('conteúdo real em /content', () => {
  const report = validateContent(files);

  it('passa na validação sem erros', () => {
    expect(report.errors).toEqual([]);
  });

  it('tem as seis profissões com o mínimo de termos e 3 a 4 áreas', () => {
    const ids = Object.keys(report.stats.professions).sort();
    expect(ids).toEqual(
      [
        'fachinformatiker',
        'industriemechaniker',
        'ingenieur',
        'koch',
        'lagerlogistik',
        'pflegefachkraft',
      ].sort(),
    );
    for (const p of Object.values(report.stats.professions)) {
      expect(p.terms).toBeGreaterThanOrEqual(MIN_TERMS_PER_PROFESSION);
      const areas = Object.keys(p.areas).length;
      expect(areas).toBeGreaterThanOrEqual(3);
      expect(areas).toBeLessThanOrEqual(4);
      expect(p.situations).toBeGreaterThanOrEqual(1);
    }
  });

  it('cobre 100% dos termos em pt-BR', () => {
    expect(report.stats.coverage['pt-BR']).toBe(100);
  });
});

/** Conteúdo mínimo válido para testar regras isoladas. */
function fixture() {
  const term = (id: string, over: Record<string, unknown> = {}) => ({
    id,
    level: 'A2',
    de: { word: 'Feile', article: 'die', plural: 'Feilen', gender: 'f', pos: 'noun' },
    status: 'rascunho',
    examples: [
      { de: 'a', tr: { 'pt-BR': 'a' } },
      { de: 'b', tr: { 'pt-BR': 'b' } },
    ],
    tr: { 'pt-BR': { term: 'lima', technical: 't', simple: 's' } },
    ...over,
  });
  const terms = Array.from({ length: MIN_TERMS_PER_PROFESSION }, (_, i) =>
    term(`x-${i}`, {
      de: { word: `Wort${i}`, article: 'das', plural: null, gender: 'n', pos: 'noun' },
    }),
  );
  const area = (id: string) => ({ id, de: id, tr: { 'pt-BR': id } });
  return {
    'locales/pt-BR.json': {
      code: 'pt-BR',
      name: 'Português',
      dir: 'ltr',
      speechLang: 'pt-BR',
      variants: [{ code: 'pt-PT', label: 'Portugal' }],
      ui: { a: 'A' },
    },
    'professions/test/profession.json': {
      id: 'test',
      de: 'Test',
      deTitleCv: 'Test',
      isco08: '1234',
      regulated: false,
      order: 1,
      areas: [area('a1'), area('a2'), area('a3')],
      tr: {
        'pt-BR': {
          name: 'Teste',
          summary: 's',
          brazil: ['b'],
          equivalence: 'e',
          regulation: 'r',
          recognition: { authority: 'a', steps: ['s'] },
          cvTitle: 'c',
        },
      },
    },
    'professions/test/terms/a1.json': { area: 'a1', terms: terms.slice(0, 20) },
    'professions/test/terms/a2.json': { area: 'a2', terms: terms.slice(20, 30) },
    'professions/test/terms/a3.json': { area: 'a3', terms: [...terms.slice(30), term('ok')] },
  } as Record<string, unknown>;
}

function withTerm(over: Record<string, unknown>) {
  const f = fixture();
  const file = f['professions/test/terms/a3.json'] as { terms: Record<string, unknown>[] };
  const last = file.terms[file.terms.length - 1] ?? {};
  file.terms[file.terms.length - 1] = { ...last, ...over };
  return validateContent(f);
}

describe('regras do validador', () => {
  it('aceita o conteúdo mínimo', () => {
    expect(validateContent(fixture()).errors).toEqual([]);
  });

  it('recusa artigo que não combina com o gênero', () => {
    const r = withTerm({
      de: { word: 'Feile', article: 'der', plural: 'Feilen', gender: 'f', pos: 'noun' },
    });
    expect(r.errors.join()).toMatch(/não combina com gênero/);
  });

  it('recusa substantivo sem artigo e verbo com plural', () => {
    expect(
      withTerm({
        de: { word: 'Feile', article: null, plural: null, gender: null, pos: 'noun' },
      }).errors.join(),
    ).toMatch(/precisa de artigo/);
    expect(
      withTerm({
        de: { word: 'feilen', article: null, plural: 'x', gender: null, pos: 'verb' },
      }).errors.join(),
    ).toMatch(/só substantivos/);
  });

  it('recusa plural com artigo', () => {
    const r = withTerm({
      de: { word: 'Feile', article: 'die', plural: 'die Feilen', gender: 'f', pos: 'noun' },
    });
    expect(r.errors.join()).toMatch(/plural sem artigo/);
  });

  it('confere a decomposição com a palavra', () => {
    const parts = (a: string, b: string) => [
      { de: a, tr: { 'pt-BR': 'x' } },
      { de: b, tr: { 'pt-BR': 'y' } },
    ];
    expect(withTerm({ parts: parts('Fei', 'le') }).errors).toEqual([]);
    expect(withTerm({ parts: parts('Fei', 'lx') }).errors.join()).toMatch(/decomposição/);
  });

  it('recusa termo relacionado inexistente', () => {
    expect(withTerm({ related: ['nao-existe'] }).errors.join()).toMatch(/não existe/);
  });

  it('exige o idioma padrão e recusa idiomas desconhecidos', () => {
    expect(
      withTerm({ tr: { tr: { term: 'x', technical: 't', simple: 's' } } }).errors.join(),
    ).toMatch(/falta o idioma pt-BR/);
  });

  it('recusa variante não declarada no idioma', () => {
    const r = withTerm({
      tr: { 'pt-BR': { term: 'lima', variants: { 'pt-AO': 'x' }, technical: 't', simple: 's' } },
    });
    expect(r.errors.join()).toMatch(/variante "pt-AO"/);
  });

  it('exige exatamente dois exemplos', () => {
    const r = withTerm({ examples: [{ de: 'a', tr: { 'pt-BR': 'a' } }] });
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('confere os termos destacados nas situações', () => {
    const f = fixture();
    f['professions/test/situations.json'] = {
      situations: [
        {
          id: 's1',
          level: 'B1',
          tr: { 'pt-BR': { title: 't', context: 'c' } },
          lines: [
            { speaker: 'A', de: 'Die [[ok|Feile]] ist da.', tr: { 'pt-BR': 'x' } },
            { speaker: 'B', de: 'Die [[sumiu|Feile]] fehlt.', tr: { 'pt-BR': 'x' } },
            { speaker: 'A', de: 'Ja.', tr: { 'pt-BR': 'x' } },
            { speaker: 'B', de: 'Nein [[ok|kaputt.', tr: { 'pt-BR': 'x' } },
          ],
        },
      ],
    };
    const errors = validateContent(f).errors.join('\n');
    expect(errors).toMatch(/"sumiu" não existe/);
    expect(errors).toMatch(/malformada/);
  });

  it('exige o mínimo de termos por profissão', () => {
    const f = fixture();
    (f['professions/test/terms/a1.json'] as { terms: unknown[] }).terms.splice(0, 5);
    expect(validateContent(f).errors.join()).toMatch(/mínimo/);
  });
});
