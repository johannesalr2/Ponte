import type { EscoLang } from './languages';
import { parseOccupation, parseSearch, parseSkill } from './parse';
import type { Occupation, OccupationHit, Page, Skill } from './types';

/**
 * Fonte dos dados da ESCO. A aplicação só conhece esta interface: trocar a API
 * pública por um servidor próprio (ESCO instalada localmente ou um backend com
 * a base baixada) é só criar outra implementação ou mudar a URL em config.ts.
 */
export interface EscoSource {
  searchOccupations(text: string, lang: EscoLang, offset?: number): Promise<Page<OccupationHit>>;
  /** `lang` define o idioma dos títulos das habilidades ligadas */
  occupation(uri: string, lang: EscoLang): Promise<Occupation>;
  skill(uri: string, lang: EscoLang): Promise<Skill>;
}

export interface HttpSourceConfig {
  /** ex.: https://ec.europa.eu/esco/api (sem barra no fim) */
  baseUrl: string;
  /** versão da classificação (ex.: "v1.2.0"); vazio = padrão do servidor */
  version?: string;
  pageSize?: number;
  fetch?: typeof fetch;
}

export class EscoError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'EscoError';
  }
}

/**
 * Implementação para a Web Service API da ESCO (pública ou instalada localmente:
 * as duas têm os mesmos endpoints). Respostas ficam em memória durante a sessão;
 * o service worker guarda uma cópia para uso offline.
 */
export function createHttpSource(config: HttpSourceConfig): EscoSource {
  const base = config.baseUrl.replace(/\/+$/, '');
  const doFetch = config.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  const pageSize = config.pageSize ?? 20;
  const cache = new Map<string, Promise<unknown>>();

  const get = (path: string, params: Record<string, string | number>): Promise<unknown> => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
    if (config.version) qs.set('selectedVersion', config.version);
    const url = `${base}${path}?${qs.toString()}`;
    let p = cache.get(url);
    if (!p) {
      p = doFetch(url, { headers: { Accept: 'application/json' } }).then(async (res) => {
        if (!res.ok) throw new EscoError(`ESCO respondeu ${res.status}`, res.status);
        return (await res.json()) as unknown;
      });
      p.catch(() => cache.delete(url)); // erro não fica guardado
      cache.set(url, p);
    }
    return p;
  };

  return {
    async searchOccupations(text, lang, offset = 0) {
      const raw = await get('/search', {
        text,
        language: lang,
        type: 'occupation',
        limit: pageSize,
        offset,
        full: 'false',
      });
      return parseSearch(raw);
    },
    async occupation(uri, lang) {
      return parseOccupation(await get('/resource/occupation', { uri, language: lang }));
    },
    async skill(uri, lang) {
      return parseSkill(await get('/resource/skill', { uri, language: lang }));
    },
  };
}
