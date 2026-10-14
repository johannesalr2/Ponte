import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import ptBR from '../content/locales/pt-BR.json';
import { createI18n } from '../src/content/locale';
import { parseMarkup, stripMarkup } from '../src/lib/markup';
import { renderCv, emptyCv, CV_DE } from '../src/lib/cv';

const ui = ptBR.ui as Record<string, string>;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? sourceFiles(full) : /\.tsx?$/.test(name) ? [full] : [];
  });
}

describe('textos da interface', () => {
  const src = sourceFiles(fileURLToPath(new URL('../src', import.meta.url)))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');

  it('toda chave literal usada no código existe em pt-BR', () => {
    const keys = [...src.matchAll(/\bt\('([a-zA-Z0-9_.-]+)'/g)].map((m) => m[1] ?? '');
    const missing = [...new Set(keys)].filter((k) => !(k in ui));
    expect(missing).toEqual([]);
  });

  it('toda chave de plural tem a forma "other"', () => {
    const keys = [...src.matchAll(/\btp\('([a-zA-Z0-9_.-]+)'/g)].map((m) => m[1] ?? '');
    const missing = [...new Set(keys)].filter((k) => !(`${k}.other` in ui));
    expect(missing).toEqual([]);
  });

  it('interpola variáveis e trata o plural, inclusive zero', () => {
    const i18n = createI18n('pt-BR');
    expect(i18n.t('term.nextReview', { value: 3, unit: 'd' })).toBe('Próxima revisão em 3 d.');
    expect(i18n.tp('glossary.results', 1)).toBe('1 termo');
    expect(i18n.tp('glossary.results', 12)).toBe('12 termos');
    expect(i18n.tp('glossary.results', 0)).toBe('Nenhum termo');
  });

  it('usa o idioma padrão quando o idioma pedido não existe', () => {
    const i18n = createI18n('xx');
    expect(i18n.locale.code).toBe('pt-BR');
    expect(i18n.pick({ 'pt-BR': 'a', tr: 'b' })).toBe('a');
  });
});

describe('marcação das situações', () => {
  it('separa texto e termos destacados', () => {
    expect(parseMarkup('Die [[im-welle|Welle]] läuft.')).toEqual([
      { text: 'Die ' },
      { text: 'Welle', termId: 'im-welle' },
      { text: ' läuft.' },
    ]);
    expect(stripMarkup('A [[x|b]] c [[y|d]]')).toBe('A b c d');
  });
});

describe('currículo bilíngue', () => {
  it('gera as duas versões com os títulos do idioma certo', () => {
    const cv = {
      ...emptyCv({ german: 'Alemão', mother: 'Português', native: 'Língua materna' }),
      name: 'Maria Exemplo',
      experience: [
        {
          id: '1',
          from: '03/2021',
          to: '',
          title: { de: 'Instandhalterin', pt: 'Técnica de manutenção' },
          place: 'São Paulo',
          details: { de: 'Wartung von Pressen', pt: 'Manutenção de prensas' },
        },
      ],
    };
    const skills = [{ de: 'Messschieber', pt: 'paquímetro' }];
    const de = renderCv(cv, 'de', CV_DE, 'Industriemechaniker/in', skills);
    expect(de).toContain('BERUFSERFAHRUNG');
    expect(de).toContain('03/2021 – heute  Instandhalterin');
    expect(de).toContain('Messschieber');
    expect(de).toContain('Portugiesisch: Muttersprache');
    const pt = renderCv(
      cv,
      'pt',
      {
        ...CV_DE,
        title: 'Currículo',
        experience: 'Experiência',
        skills: 'Conhecimentos',
        languages: 'Idiomas',
        today: 'atual',
      },
      'Mecânica Industrial',
      skills,
    );
    expect(pt).toContain('EXPERIÊNCIA');
    expect(pt).toContain('Técnica de manutenção');
    expect(pt).toContain('paquímetro');
    expect(pt).not.toContain('Instandhalterin');
  });
});
