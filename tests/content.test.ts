import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MIN_TERMS_PER_PROFESSION } from '../src/content/config';
import { fixture, fixtureWithTerm } from './helpers';
import { validateContent } from '../src/content/validate';
import { listMedia, readContentDir } from '../scripts/read-content';

const root = fileURLToPath(new URL('../content', import.meta.url));
const files = readContentDir(root);

describe('conteúdo real em /content', () => {
  const report = validateContent(files, listMedia(root));

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

const withTerm = (over: Record<string, unknown>) => validateContent(fixtureWithTerm(over));

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
