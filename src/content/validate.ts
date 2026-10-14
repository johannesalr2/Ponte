import type { ZodError } from 'zod';
import { DEFAULT_LOCALE, MIN_TERMS_PER_PROFESSION } from './config';
import {
  localeSchema,
  professionSchema,
  situationFileSchema,
  termFileSchema,
  type LocaleSource,
  type Profession,
  type SituationFile,
  type TermFile,
} from './schema';

/**
 * Validação completa do conteúdo. Recebe um mapa caminho → JSON já lido
 * (caminhos relativos a /content, ex.: "professions/koch/terms/hygiene.json"),
 * para poder rodar no Node (script e testes) e no plugin do Vite.
 */

export interface ValidationReport {
  errors: string[];
  warnings: string[];
  stats: {
    locales: string[];
    professions: Record<
      string,
      { terms: number; areas: Record<string, number>; situations: number }
    >;
    status: Record<string, number>;
    /** porcentagem de termos traduzidos por idioma */
    coverage: Record<string, number>;
    totalTerms: number;
  };
}

const ARTICLE_GENDER = { der: 'm', die: 'f', das: 'n' } as const;
const MARKUP = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;

function zodMessages(file: string, error: ZodError): string[] {
  return error.issues.map((i) => `${file}: ${i.path.join('.') || '(raiz)'} — ${i.message}`);
}

export function validateContent(files: Record<string, unknown>): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: ValidationReport['stats'] = {
    locales: [],
    professions: {},
    status: {},
    coverage: {},
    totalTerms: 0,
  };

  // ------------------------------------------------------------ idiomas
  const locales = new Map<string, LocaleSource>();
  for (const [path, json] of Object.entries(files)) {
    const m = /^locales\/([^/]+)\.json$/.exec(path);
    if (!m) continue;
    const parsed = localeSchema.safeParse(json);
    if (!parsed.success) {
      errors.push(...zodMessages(path, parsed.error));
      continue;
    }
    if (parsed.data.code !== m[1]) {
      errors.push(`${path}: "code" (${parsed.data.code}) deve ser igual ao nome do arquivo`);
    }
    locales.set(parsed.data.code, parsed.data);
  }
  const base = locales.get(DEFAULT_LOCALE);
  if (!base) {
    errors.push(`locales/${DEFAULT_LOCALE}.json é obrigatório`);
  } else {
    for (const loc of locales.values()) {
      if (loc === base) continue;
      const missing = Object.keys(base.ui).filter((k) => !(k in loc.ui));
      if (missing.length) {
        warnings.push(
          `locales/${loc.code}.json: ${missing.length} textos da interface sem tradução (usa ${DEFAULT_LOCALE})`,
        );
      }
      const extra = Object.keys(loc.ui).filter((k) => !(k in base.ui));
      if (extra.length)
        errors.push(`locales/${loc.code}.json: chaves desconhecidas: ${extra.join(', ')}`);
    }
  }
  stats.locales = [...locales.keys()].sort();
  const knownLocale = (code: string) => locales.has(code);
  const variantsOf = (code: string) => new Set(locales.get(code)?.variants.map((v) => v.code));

  const checkLocalized = (where: string, map: Record<string, unknown>) => {
    if (!(DEFAULT_LOCALE in map)) errors.push(`${where}: falta o idioma ${DEFAULT_LOCALE}`);
    for (const code of Object.keys(map)) {
      if (!knownLocale(code))
        errors.push(`${where}: idioma "${code}" não existe em /content/locales`);
    }
  };

  // ------------------------------------------------------------ profissões
  const professions = new Map<string, Profession>();
  for (const [path, json] of Object.entries(files)) {
    const m = /^professions\/([^/]+)\/profession\.json$/.exec(path);
    if (!m) continue;
    const parsed = professionSchema.safeParse(json);
    if (!parsed.success) {
      errors.push(...zodMessages(path, parsed.error));
      continue;
    }
    const p = parsed.data;
    if (p.id !== m[1]) errors.push(`${path}: "id" (${p.id}) deve ser igual ao nome da pasta`);
    checkLocalized(`${path} tr`, p.tr);
    p.areas.forEach((a) => checkLocalized(`${path} áreas.${a.id}`, a.tr));
    p.industries.forEach((i) => checkLocalized(`${path} ramos.${i.id}`, i.tr));
    professions.set(p.id, p);
    stats.professions[p.id] = { terms: 0, areas: {}, situations: 0 };
  }

  // ------------------------------------------------------------ termos
  const termFiles: { path: string; profession: string; data: TermFile }[] = [];
  for (const [path, json] of Object.entries(files)) {
    const m = /^professions\/([^/]+)\/terms\/([^/]+)\.json$/.exec(path);
    if (!m) continue;
    const [, profession = '', fileArea] = m;
    const parsed = termFileSchema.safeParse(json);
    if (!parsed.success) {
      errors.push(...zodMessages(path, parsed.error));
      continue;
    }
    if (parsed.data.area !== fileArea) {
      errors.push(`${path}: "area" (${parsed.data.area}) deve ser igual ao nome do arquivo`);
    }
    const prof = professions.get(profession);
    if (!prof) errors.push(`${path}: profissão "${profession}" sem profession.json`);
    else if (!prof.areas.some((a) => a.id === parsed.data.area)) {
      errors.push(`${path}: área "${parsed.data.area}" não está declarada em profession.json`);
    }
    termFiles.push({ path, profession, data: parsed.data });
  }

  const ids = new Map<string, string>();
  const words = new Map<string, string>();
  for (const { path, data } of termFiles) {
    for (const t of data.terms) {
      if (ids.has(t.id))
        errors.push(`${path}: id duplicado "${t.id}" (também em ${ids.get(t.id)})`);
      ids.set(t.id, path);
    }
  }

  const translated: Record<string, number> = {};
  for (const { path, profession, data } of termFiles) {
    const pstats = stats.professions[profession];
    for (const t of data.terms) {
      const where = `${path} [${t.id}]`;
      const { word, article, plural, gender, pos } = t.de;
      stats.totalTerms++;
      stats.status[t.status] = (stats.status[t.status] ?? 0) + 1;
      if (pstats) {
        pstats.terms++;
        pstats.areas[data.area] = (pstats.areas[data.area] ?? 0) + 1;
      }

      const wordKey = `${profession}:${article ?? ''} ${word}`.toLowerCase();
      if (words.has(wordKey))
        warnings.push(`${where}: "${word}" repetido (também ${words.get(wordKey)})`);
      words.set(wordKey, t.id);

      if (pos === 'noun') {
        if (!article || !gender) errors.push(`${where}: substantivo precisa de artigo e gênero`);
        else if (ARTICLE_GENDER[article] !== gender) {
          errors.push(`${where}: artigo "${article}" não combina com gênero "${gender}"`);
        }
        if (word[0] !== word[0]?.toUpperCase())
          errors.push(`${where}: substantivo deve começar com maiúscula`);
      } else if (pos !== 'abbreviation' && pos !== 'phrase') {
        if (article || gender || plural) {
          errors.push(`${where}: só substantivos têm artigo, gênero e plural`);
        }
      }
      if (plural && /^(der|die|das)\s/i.test(plural)) {
        errors.push(`${where}: escreva o plural sem artigo`);
      }
      if (t.parts) {
        const joined = t.parts
          .map((p) => p.de)
          .join('')
          .toLowerCase();
        if (joined !== word.toLowerCase()) {
          errors.push(
            `${where}: decomposição "${t.parts.map((p) => p.de).join(' + ')}" ≠ "${word}"`,
          );
        }
        t.parts.forEach((p, i) => checkLocalized(`${where} parts[${i}]`, p.tr));
      }
      for (const r of t.related) {
        if (r === t.id) errors.push(`${where}: termo relacionado a si mesmo`);
        else if (!ids.has(r)) errors.push(`${where}: relacionado "${r}" não existe`);
      }
      checkLocalized(`${where} tr`, t.tr);
      t.examples.forEach((e, i) => checkLocalized(`${where} examples[${i}]`, e.tr));
      for (const [code, tr] of Object.entries(t.tr)) {
        translated[code] = (translated[code] ?? 0) + 1;
        const allowed = variantsOf(code);
        for (const v of Object.keys(tr.variants ?? {})) {
          if (!allowed.has(v))
            errors.push(`${where}: variante "${v}" não declarada em locales/${code}.json`);
          if (tr.variants?.[v] === tr.term) {
            warnings.push(`${where}: variante ${v} igual à tradução principal (remova)`);
          }
        }
      }
    }
  }
  for (const code of stats.locales) {
    stats.coverage[code] = stats.totalTerms
      ? Math.round(((translated[code] ?? 0) / stats.totalTerms) * 100)
      : 0;
  }

  for (const [id, p] of Object.entries(stats.professions)) {
    if (p.terms < MIN_TERMS_PER_PROFESSION) {
      errors.push(`professions/${id}: ${p.terms} termos (mínimo ${MIN_TERMS_PER_PROFESSION})`);
    }
    const prof = professions.get(id);
    for (const a of prof?.areas ?? []) {
      if (!p.areas[a.id]) errors.push(`professions/${id}: área "${a.id}" sem termos`);
    }
  }

  // ------------------------------------------------------------ situações
  for (const [path, json] of Object.entries(files)) {
    const m = /^professions\/([^/]+)\/situations\.json$/.exec(path);
    if (!m) continue;
    const parsed = situationFileSchema.safeParse(json);
    if (!parsed.success) {
      errors.push(...zodMessages(path, parsed.error));
      continue;
    }
    const sit: SituationFile = parsed.data;
    const pstats = stats.professions[m[1] ?? ''];
    if (pstats) pstats.situations = sit.situations.length;
    for (const s of sit.situations) {
      checkLocalized(`${path} [${s.id}]`, s.tr);
      s.lines.forEach((line, i) => {
        const where = `${path} [${s.id}] linha ${i + 1}`;
        checkLocalized(where, line.tr);
        const stripped = line.de.replace(MARKUP, '');
        if (/\[\[|\]\]/.test(stripped)) errors.push(`${where}: marcação [[id|texto]] malformada`);
        for (const [, ref] of line.de.matchAll(MARKUP)) {
          if (ref && !ids.has(ref)) errors.push(`${where}: termo "${ref}" não existe`);
        }
      });
      if (!s.lines.some((l) => l.de.includes('[['))) {
        warnings.push(`${path} [${s.id}]: nenhum termo destacado`);
      }
    }
  }

  return { errors, warnings, stats };
}
