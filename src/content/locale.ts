import { createContext, useContext } from 'react';
import type ptBR from '@content/locales/pt-BR.json';
import { DEFAULT_LOCALE } from './config';
import { locales } from './loader';
import type { LocaleSource, Term, TermTranslation } from './schema';

/** Chaves de texto da interface, tiradas do idioma padrão (erros de chave falham no tsc). */
export type UiKey = keyof (typeof ptBR)['ui'];
type Vars = Record<string, string | number>;

export interface I18n {
  locale: LocaleSource;
  t: (key: UiKey, vars?: Vars) => string;
  /** plural: procura `key.zero` (se 0), depois `key.one`, `key.other`… conforme Intl.PluralRules */
  tp: (key: string, count: number, vars?: Vars) => string;
  /** escolhe o valor de um mapa { "pt-BR": … } com fallback para o idioma padrão */
  pick: <T>(map: Record<string, T> | undefined) => T | undefined;
  termTr: (term: Term) => TermTranslation | undefined;
  number: (n: number) => string;
  date: (d: Date | number, opts?: Intl.DateTimeFormatOptions) => string;
}

const fallbackLocale = (): LocaleSource => {
  const base = locales.find((l) => l.code === DEFAULT_LOCALE);
  if (!base) throw new Error(`Idioma padrão ${DEFAULT_LOCALE} ausente em /content/locales`);
  return base;
};

function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function createI18n(code: string): I18n {
  const base = fallbackLocale();
  const locale = locales.find((l) => l.code === code) ?? base;
  const raw = (key: string): string | undefined => locale.ui[key] ?? base.ui[key];
  const plural = new Intl.PluralRules(locale.code);
  const nf = new Intl.NumberFormat(locale.code);
  const pick = <T>(map: Record<string, T> | undefined): T | undefined =>
    map ? (map[locale.code] ?? map[DEFAULT_LOCALE]) : undefined;
  return {
    locale,
    t: (key, vars) => interpolate(raw(key) ?? key, vars),
    tp: (key, count, vars) => {
      const text =
        (count === 0 ? raw(`${key}.zero`) : undefined) ??
        raw(`${key}.${plural.select(count)}`) ??
        raw(`${key}.other`) ??
        key;
      return interpolate(text, { count: nf.format(count), ...vars });
    },
    pick,
    termTr: (term) => pick(term.tr),
    number: (n) => nf.format(n),
    date: (d, opts) => new Intl.DateTimeFormat(locale.code, opts).format(d),
  };
}

export const I18nContext = createContext<I18n | null>(null);

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n fora do I18nProvider');
  return ctx;
}
