import { fileURLToPath } from 'node:url';
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
