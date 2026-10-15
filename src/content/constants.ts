/** Constantes do modelo de conteúdo, sem dependências (usadas no app sem carregar o Zod). */
export const LEVELS = ['A2', 'B1', 'B2', 'C1'] as const;
export const ARTICLES = ['der', 'die', 'das'] as const;
export const GENDERS = ['m', 'f', 'n'] as const;
export const POS = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'abbreviation'] as const;
/**
 * Tipo do termo. `objeto` = coisa física que se pode pegar ou apontar (ferramenta,
 * peça, máquina, aparelho, utensílio, veículo, roupa de proteção).
 */
export const KINDS = [
  'objeto', // ferramenta, peça, máquina, aparelho, utensílio
  'material', // substância sem forma própria: resina, aço, óleo, caldo, remédio
  'pessoa', // pessoa, função ou empresa
  'local', // lugar, área, setor físico
  'documento', // papel ou registro: manual, nota de entrega, prontuário
  'software', // programa ou sistema digital
  'acao', // verbo ou expressão de ação
  'processo', // atividade, procedimento, método ou evento planejado
  'fenomeno', // falha, defeito, sintoma, estado ou acontecimento
  'grandeza', // propriedade mensurável: tensão, dureza, peso, tempo
  'caracteristica', // adjetivo: estéril, perecível
  'conceito', // ideia abstrata, regra, categoria
] as const;
export const REVIEW_STATUS = ['rascunho', 'revisado-ia', 'revisado-profissional'] as const;
/** Licenças aceitas para fotos: só material sem direitos autorais reservados. */
export const IMAGE_LICENSES = ['CC0', 'Public Domain'] as const;
