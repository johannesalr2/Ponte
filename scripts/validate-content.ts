/**
 * Valida todo o conteúdo de /content. Roda em `npm run validate` e antes do build.
 * Sai com código 1 se houver erros.
 */
import { fileURLToPath } from 'node:url';
import { validateContent } from '../src/content/validate';
import { listMedia, readContentDir } from './read-content';

const root = fileURLToPath(new URL('../content', import.meta.url));
const report = validateContent(readContentDir(root), listMedia(root));

for (const w of report.warnings) console.warn(`aviso: ${w}`);
for (const e of report.errors) console.error(`ERRO: ${e}`);

const { stats } = report;
console.log(`\nIdiomas: ${stats.locales.join(', ')}`);
for (const [code, pct] of Object.entries(stats.coverage))
  console.log(`  ${code}: ${pct}% dos termos`);
console.log(`Termos: ${stats.totalTerms} (${stats.images} com foto)`);
for (const [id, p] of Object.entries(stats.professions)) {
  const areas = Object.entries(p.areas)
    .map(([a, n]) => `${a} ${n}`)
    .join(', ');
  console.log(`  ${id}: ${p.terms} termos (${areas}); ${p.situations} situações`);
}
console.log(
  `Status: ${Object.entries(stats.status)
    .map(([s, n]) => `${s} ${n}`)
    .join(', ')}`,
);

if (report.errors.length) {
  console.error(`\n${report.errors.length} erro(s). Corrija antes de publicar.`);
  process.exit(1);
}
console.log('\nConteúdo válido.');
