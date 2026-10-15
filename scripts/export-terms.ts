/**
 * Gera uma lista em Markdown dos termos de uma profissão, para revisão
 * por profissionais: `npm run export-terms -- industriemechaniker`.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Profession, TermFile } from '../src/content/schema';
import { readContentDir } from './read-content';

const id = process.argv[2];
if (!id) {
  console.error('Uso: npm run export-terms -- <profissão>');
  process.exit(1);
}
const files = readContentDir(fileURLToPath(new URL('../content', import.meta.url)));
const prof = files[`professions/${id}/profession.json`] as Profession | undefined;
if (!prof) {
  console.error(`Profissão "${id}" não encontrada.`);
  process.exit(1);
}
const STATUS = {
  rascunho: '✎ rascunho',
  'revisado-ia': '✓ IA',
  'revisado-profissional': '✓✓ profissional',
};
const cell = (s: string) => s.replace(/\|/g, '\\|');
const lines: string[] = [
  `# ${prof.de} — ${prof.tr['pt-BR']?.name ?? ''}`,
  '',
  'Lista gerada a partir de `/content` (não edite à mão: rode `npm run export-terms`).',
  'Na coluna "Revisão", ✎ indica dúvida a conferir; nenhum termo foi revisado por profissional ainda.',
];
let total = 0;
for (const area of prof.areas) {
  const file = files[`professions/${id}/terms/${area.id}.json`] as TermFile | undefined;
  if (!file) continue;
  lines.push('', `## ${area.de} — ${area.tr['pt-BR'] ?? ''} (${file.terms.length})`, '');
  lines.push(
    '| Alemão | Plural | Português (BR) | Portugal | Nível | Revisão |',
    '|---|---|---|---|---|---|',
  );
  for (const t of [...file.terms].sort((a, b) => a.de.word.localeCompare(b.de.word, 'de'))) {
    const tr = t.tr['pt-BR'];
    const de = t.de.article ? `${t.de.article} **${t.de.word}**` : `**${t.de.word}**`;
    lines.push(
      `| ${cell(de)} | ${t.de.plural ? `die ${t.de.plural}` : '—'} | ${cell(tr?.term ?? '')} | ${cell(tr?.variants?.['pt-PT'] ?? '')} | ${t.level} | ${STATUS[t.status]} |`,
    );
    total++;
  }
}
lines.splice(4, 0, '', `**${total} termos.**`);
const out = fileURLToPath(new URL(`../docs/termos-${id}.md`, import.meta.url));
writeFileSync(out, lines.join('\n') + '\n');
console.log(`${total} termos → docs/termos-${id}.md`);
