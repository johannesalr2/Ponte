import { z } from 'zod';

/**
 * Esquemas Zod do conteúdo em /content. São a fonte da verdade dos tipos:
 * o build falha se um JSON não respeitar estes esquemas (ver validate.ts).
 */

import { ARTICLES, GENDERS, IMAGE_LICENSES, LEVELS, POS, REVIEW_STATUS } from './constants';

export { ARTICLES, GENDERS, IMAGE_LICENSES, LEVELS, POS, REVIEW_STATUS };

export const levelSchema = z.enum(LEVELS);
export const articleSchema = z.enum(ARTICLES);
export const reviewStatusSchema = z.enum(REVIEW_STATUS);

const id = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'use apenas minúsculas, números e hífens (kebab-case)');
const localeCode = z.string().regex(/^[a-z]{2,3}(-[A-Z]{2})?$/, 'código de idioma inválido');
const text = z.string().trim().min(1);

/** Mapa { "pt-BR": valor, "tr": valor, ... } */
const localized = <T extends z.ZodTypeAny>(value: T) => z.record(localeCode, value);

// ---------------------------------------------------------------- idiomas

export const localeSchema = z
  .object({
    code: localeCode,
    name: text,
    dir: z.enum(['ltr', 'rtl']),
    speechLang: text,
    variants: z.array(z.object({ code: localeCode, label: text })).default([]),
    ui: z.record(z.string(), z.string()),
  })
  .strict();

// ---------------------------------------------------------------- termos

const germanSchema = z
  .object({
    word: text,
    article: articleSchema.nullable(),
    plural: text.nullable(),
    gender: z.enum(GENDERS).nullable(),
    pos: z.enum(POS),
  })
  .strict();

const partSchema = z.object({ de: text, tr: localized(text) }).strict();

const exampleSchema = z.object({ de: text, tr: localized(text) }).strict();

const falseFriendSchema = z.object({ word: text, note: text }).strict();

const termTranslationSchema = z
  .object({
    term: text,
    variants: z.record(localeCode, text).optional(),
    technical: text,
    simple: text,
    falseFriends: z.array(falseFriendSchema).optional(),
  })
  .strict();

export const termSourceSchema = z
  .object({
    id,
    level: levelSchema,
    de: germanSchema,
    parts: z.array(partSchema).min(2).optional(),
    synonyms: z.array(text).default([]),
    related: z.array(id).default([]),
    esco: z.object({ uri: z.string().url(), label: text }).strict().nullable().default(null),
    /** fontes consultadas para o termo (normas, glossários, literatura técnica) */
    sources: z.array(z.object({ label: text, url: z.string().url() }).strict()).optional(),
    /** foto do objeto, só com licença livre de direitos (CC0 ou domínio público) */
    image: z
      .object({
        file: z
          .string()
          .regex(
            /^media\/[a-z0-9-]+\/[a-z0-9-]+\.(webp|jpg|jpeg|png|svg)$/,
            'use media/<profissão>/<id>.jpg',
          ),
        alt: localized(text),
        author: text,
        license: z.enum(IMAGE_LICENSES),
        source: z.string().url(),
      })
      .strict()
      .optional(),
    status: reviewStatusSchema,
    examples: z.array(exampleSchema).length(2),
    tr: localized(termTranslationSchema),
  })
  .strict();

export const termFileSchema = z
  .object({
    area: id,
    terms: z.array(termSourceSchema).min(1),
  })
  .strict();

// ---------------------------------------------------------------- profissão

const linkSchema = z.object({ label: text, url: z.string().url() }).strict();

const professionTranslationSchema = z
  .object({
    name: text,
    summary: text,
    brazil: z.array(text).min(1),
    equivalence: text,
    regulation: text,
    recognition: z
      .object({
        authority: text,
        steps: z.array(text).min(1),
        documents: z.array(text).default([]),
        notes: text.optional(),
      })
      .strict(),
    links: z.array(linkSchema).default([]),
    cvTitle: text,
  })
  .strict();

export const professionSchema = z
  .object({
    id,
    de: text,
    deTitleCv: text,
    isco08: z.string().regex(/^\d{4}$/),
    regulated: z.boolean(),
    order: z.number().int(),
    areas: z
      .array(z.object({ id, de: text, tr: localized(text) }).strict())
      .min(3)
      .max(4),
    industries: z.array(z.object({ id, tr: localized(text) }).strict()).default([]),
    tr: localized(professionTranslationSchema),
  })
  .strict();

// ---------------------------------------------------------------- situações

const situationLineSchema = z
  .object({
    speaker: text,
    de: text,
    tr: localized(text),
  })
  .strict();

export const situationSchema = z
  .object({
    id,
    level: levelSchema,
    tr: localized(z.object({ title: text, context: text }).strict()),
    lines: z.array(situationLineSchema).min(4),
  })
  .strict();

export const situationFileSchema = z
  .object({ situations: z.array(situationSchema).min(1) })
  .strict();

// ---------------------------------------------------------------- tipos

export type Level = z.infer<typeof levelSchema>;
export type Article = z.infer<typeof articleSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type PartOfSpeech = (typeof POS)[number];
export type LocaleSource = z.infer<typeof localeSchema>;
export type TermSource = z.infer<typeof termSourceSchema>;
export type TermFile = z.infer<typeof termFileSchema>;
export type TermTranslation = z.infer<typeof termTranslationSchema>;
export type Profession = z.infer<typeof professionSchema>;
export type ProfessionTranslation = z.infer<typeof professionTranslationSchema>;
export type Situation = z.infer<typeof situationSchema>;
export type SituationFile = z.infer<typeof situationFileSchema>;

/** Termo como a aplicação o usa: com profissão e área injetadas. */
export type Term = TermSource & { profession: string; area: string };
