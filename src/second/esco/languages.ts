/**
 * Idiomas em que a ESCO publica rótulos e descrições (versão 1.2).
 * Atenção: "pt" é o português europeu; a ESCO não tem pt-BR.
 */
export const ESCO_LANGUAGES = [
  { code: 'bg', name: 'Български' },
  { code: 'cs', name: 'Čeština' },
  { code: 'da', name: 'Dansk' },
  { code: 'de', name: 'Deutsch' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'et', name: 'Eesti' },
  { code: 'fi', name: 'Suomi' },
  { code: 'fr', name: 'Français' },
  { code: 'ga', name: 'Gaeilge' },
  { code: 'hr', name: 'Hrvatski' },
  { code: 'hu', name: 'Magyar' },
  { code: 'is', name: 'Íslenska' },
  { code: 'it', name: 'Italiano' },
  { code: 'lt', name: 'Lietuvių' },
  { code: 'lv', name: 'Latviešu' },
  { code: 'mt', name: 'Malti' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'no', name: 'Norsk' },
  { code: 'pl', name: 'Polski' },
  { code: 'pt', name: 'Português (Portugal)' },
  { code: 'ro', name: 'Română' },
  { code: 'sk', name: 'Slovenčina' },
  { code: 'sl', name: 'Slovenščina' },
  { code: 'sv', name: 'Svenska' },
  { code: 'uk', name: 'Українська' },
  { code: 'ar', name: 'العربية' },
] as const;

export type EscoLang = (typeof ESCO_LANGUAGES)[number]['code'];

const CODES = new Set<string>(ESCO_LANGUAGES.map((l) => l.code));
export const isEscoLang = (code: unknown): code is EscoLang =>
  typeof code === 'string' && CODES.has(code);

export const langName = (code: EscoLang) =>
  ESCO_LANGUAGES.find((l) => l.code === code)?.name ?? code;

/** Idiomas escritos da direita para a esquerda. */
export const langDir = (code: EscoLang): 'ltr' | 'rtl' => (code === 'ar' ? 'rtl' : 'ltr');
