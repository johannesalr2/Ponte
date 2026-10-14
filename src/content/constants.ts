/** Constantes do modelo de conteúdo, sem dependências (usadas no app sem carregar o Zod). */
export const LEVELS = ['A2', 'B1', 'B2', 'C1'] as const;
export const ARTICLES = ['der', 'die', 'das'] as const;
export const GENDERS = ['m', 'f', 'n'] as const;
export const POS = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'abbreviation'] as const;
export const REVIEW_STATUS = ['rascunho', 'revisado-ia', 'revisado-profissional'] as const;
