/**
 * Baixa fotos candidatas (CC0/domínio público) para os termos listados em
 * scripts/images/candidates.json que ainda não têm foto.
 *
 *   npm run images:fetch                 # todos os pendentes
 *   npm run images:fetch -- im-feile     # só alguns
 *
 * As candidatas ficam em scripts/images/staging/<id>/ (fora do git). Depois de
 * olhar, escolha uma com `npm run images:apply -- <id> <n>`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readContentDir } from '../read-content';
import type { TermFile } from '../../src/content/schema';
import { curl, searchFreeImages } from './commons';
import candidates from './candidates.json';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const files = readContentDir(here('../../content'));
const withImage = new Set(
  Object.values(files)
    .filter((f): f is TermFile => typeof f === 'object' && f !== null && 'terms' in f)
    .flatMap((f) => f.terms.filter((t) => t.image).map((t) => t.id)),
);

const only = process.argv.slice(2);
const todo = Object.entries(candidates as Record<string, string>).filter(([id]) =>
  only.length ? only.includes(id) : !withImage.has(id),
);

let ok = 0;
for (const [id, query] of todo) {
  try {
    const found = searchFreeImages(query);
    if (!found.length) {
      console.log(`– ${id}: nenhuma foto CC0/domínio público para "${query}"`);
      continue;
    }
    const dir = here(`./staging/${id}/`);
    mkdirSync(dir, { recursive: true });
    found.forEach((c, i) => {
      const ext = c.mime.includes('png') ? 'png' : c.mime.includes('webp') ? 'webp' : 'jpg';
      writeFileSync(`${dir}${i + 1}.${ext}`, curl(c.thumbUrl, true) as Buffer);
      writeFileSync(`${dir}${i + 1}.json`, JSON.stringify({ ...c, ext }, null, 2));
    });
    ok++;
    console.log(
      `✓ ${id}: ${found.length} candidata(s) — ${found.map((c) => c.license).join(', ')}`,
    );
  } catch (e) {
    console.log(`✗ ${id}: ${(e as Error).message.split('\n')[0]}`);
  }
}
console.log(`\n${ok}/${todo.length} termos com candidatas em scripts/images/staging/`);
