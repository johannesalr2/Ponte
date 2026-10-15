/**
 * Usa a candidata <n> como foto do termo <id>: copia para
 * content/media/<profissão>/<id>.<ext> e grava o campo "image" no JSON do termo.
 *
 *   npm run images:apply -- im-feile 2
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Candidate } from './commons';

const [id, n] = process.argv.slice(2);
if (!id || !n) {
  console.error('Uso: npm run images:apply -- <id-do-termo> <número-da-candidata>');
  process.exit(1);
}
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const meta = JSON.parse(readFileSync(here(`./staging/${id}/${n}.json`), 'utf8')) as Candidate & {
  ext: string;
};

const profRoot = here('../../content/professions/');
for (const prof of readdirSync(profRoot)) {
  const termsDir = join(profRoot, prof, 'terms');
  for (const name of readdirSync(termsDir)) {
    const path = join(termsDir, name);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const term = data.terms.find((t: { id: string }) => t.id === id);
    if (!term) continue;
    const file = `media/${prof}/${id}.${meta.ext}`;
    mkdirSync(here(`../../content/media/${prof}/`), { recursive: true });
    copyFileSync(here(`./staging/${id}/${n}.${meta.ext}`), here(`../../content/${file}`));
    const word = term.tr['pt-BR']?.term ?? term.de.word;
    term.image = {
      file,
      alt: { 'pt-BR': `Foto: ${word}` },
      author: meta.author,
      license: meta.license,
      source: meta.source,
    };
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
    console.log(`✓ ${id} ← ${meta.title} (${meta.license}, ${meta.author})`);
    process.exit(0);
  }
}
console.error(`Termo "${id}" não encontrado.`);
process.exit(1);
