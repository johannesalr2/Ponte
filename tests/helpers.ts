import { fileURLToPath } from 'node:url';
import { MIN_TERMS_PER_PROFESSION } from '../src/content/config';
import type { Term, TermFile } from '../src/content/schema';
import { readContentDir } from '../scripts/read-content';

/** Todos os termos reais de /content, com profissão e área injetadas. */
export function loadTerms(): Term[] {
  const files = readContentDir(fileURLToPath(new URL('../content', import.meta.url)));
  return Object.entries(files).flatMap(([path, json]) => {
    const m = /^professions\/([^/]+)\/terms\//.exec(path);
    if (!m) return [];
    const file = json as TermFile;
    return file.terms.map((t) => ({
      ...t,
      synonyms: t.synonyms ?? [],
      related: t.related ?? [],
      profession: m[1] ?? '',
      area: file.area,
    }));
  });
}

/** Conteúdo mínimo válido para testar regras isoladas. */
export function fixture() {
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

/** Conteúdo mínimo com o último termo alterado (usado também em images.test.ts). */
export function fixtureWithTerm(over: Record<string, unknown>) {
  const f = fixture();
  const file = f['professions/test/terms/a3.json'] as { terms: Record<string, unknown>[] };
  const last = file.terms[file.terms.length - 1] ?? {};
  file.terms[file.terms.length - 1] = { ...last, ...over };
  return f;
}
