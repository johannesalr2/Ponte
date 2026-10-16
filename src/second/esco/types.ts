import type { EscoLang } from './languages';

/** Textos por idioma, como a ESCO os entrega (nem todo idioma existe em todo conceito). */
export type ByLang<T> = Partial<Record<EscoLang, T>>;

export interface Ref {
  uri: string;
  /** rótulo no idioma pedido (a ESCO cai para o inglês se faltar) */
  title: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  offset: number;
}

export interface OccupationHit extends Ref {
  code?: string;
}

export interface Occupation {
  uri: string;
  /** código ESCO (ISCO-08 + sufixo), ex.: "7233.1" */
  code?: string;
  labels: ByLang<string>;
  altLabels: ByLang<string[]>;
  descriptions: ByLang<string>;
  isco: Ref[];
  broader: Ref[];
  narrower: Ref[];
  essential: Ref[];
  optional: Ref[];
}

/** knowledge = conhecimento; skill = habilidade/competência */
export type SkillType = 'knowledge' | 'skill' | 'unknown';
export type ReuseLevel = 'transversal' | 'cross-sector' | 'sector-specific' | 'occupation-specific';

export interface Skill {
  uri: string;
  type: SkillType;
  reuse?: ReuseLevel;
  labels: ByLang<string>;
  altLabels: ByLang<string[]>;
  descriptions: ByLang<string>;
  broader: Ref[];
  essentialFor: Ref[];
  optionalFor: Ref[];
}
