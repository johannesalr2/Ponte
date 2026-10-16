import { isEscoLang } from './languages';
import type {
  ByLang,
  Occupation,
  OccupationHit,
  Page,
  Ref,
  ReuseLevel,
  Skill,
  SkillType,
} from './types';

/**
 * Converte as respostas HAL da API da ESCO no modelo da aplicação.
 * Defensivo de propósito: campos ausentes viram listas/mapas vazios, e a
 * aplicação não depende do formato exato da API (que muda entre versões).
 */

type Json = Record<string, unknown>;
const obj = (v: unknown): Json =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {};
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : v ? [v] : []);
const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined;

function refs(links: Json, key: string): Ref[] {
  return arr(links[key]).flatMap((l) => {
    const o = obj(l);
    const uri = str(o.uri) ?? str(o.href);
    const title = str(o.title);
    return uri && title ? [{ uri, title }] : [];
  });
}

function labels(v: unknown): ByLang<string> {
  const out: ByLang<string> = {};
  for (const [k, val] of Object.entries(obj(v))) {
    const s = str(val);
    if (isEscoLang(k) && s) out[k] = s;
  }
  return out;
}

function altLabels(v: unknown): ByLang<string[]> {
  const out: ByLang<string[]> = {};
  for (const [k, val] of Object.entries(obj(v))) {
    const list = arr(val).flatMap((x) => str(x) ?? []);
    if (isEscoLang(k) && list.length) out[k] = list;
  }
  return out;
}

/** description: { de: { literal, mimetype } } ou { de: "texto" } */
function descriptions(v: unknown): ByLang<string> {
  const out: ByLang<string> = {};
  for (const [k, val] of Object.entries(obj(v))) {
    const s = str(val) ?? str(obj(val).literal);
    if (isEscoLang(k) && s) out[k] = s;
  }
  return out;
}

export function parseSearch(raw: unknown): Page<OccupationHit> {
  const r = obj(raw);
  const items = arr(obj(r._embedded).results).flatMap((x) => {
    const o = obj(x);
    const uri = str(o.uri);
    const title = str(o.title) ?? str(o.preferredLabel);
    return uri && title ? [{ uri, title, code: str(o.code) }] : [];
  });
  return {
    items,
    total: typeof r.total === 'number' ? r.total : items.length,
    offset: typeof r.offset === 'number' ? r.offset : 0,
  };
}

export function parseOccupation(raw: unknown): Occupation {
  const r = obj(raw);
  const links = obj(r._links);
  const uri = str(r.uri);
  if (!uri) throw new Error('Resposta da ESCO sem "uri"');
  const own = labels(r.preferredLabel);
  return {
    uri,
    code: str(r.code),
    labels: own,
    altLabels: altLabels(r.alternativeLabel),
    descriptions: descriptions(r.description),
    isco: refs(links, 'broaderIscoGroup'),
    broader: refs(links, 'broaderOccupation'),
    narrower: refs(links, 'narrowerOccupation'),
    essential: refs(links, 'hasEssentialSkill'),
    optional: refs(links, 'hasOptionalSkill'),
  };
}

const TYPES: Record<string, SkillType> = { knowledge: 'knowledge', skill: 'skill' };
const REUSE: ReuseLevel[] = [
  'transversal',
  'cross-sector',
  'sector-specific',
  'occupation-specific',
];
const lastSegment = (uri: string) => uri.replace(/\/+$/, '').split('/').pop() ?? '';

export function parseSkill(raw: unknown): Skill {
  const r = obj(raw);
  const links = obj(r._links);
  const uri = str(r.uri);
  if (!uri) throw new Error('Resposta da ESCO sem "uri"');
  const typeUri = refs(links, 'hasSkillType')[0]?.uri ?? str(r.skillType) ?? '';
  const reuseUri = refs(links, 'hasReuseLevel')[0]?.uri ?? str(r.reuseLevel) ?? '';
  const reuse = REUSE.find((x) => x === lastSegment(reuseUri));
  return {
    uri,
    type: TYPES[lastSegment(typeUri)] ?? 'unknown',
    ...(reuse && { reuse }),
    labels: labels(r.preferredLabel),
    altLabels: altLabels(r.alternativeLabel),
    descriptions: descriptions(r.description),
    broader: [...refs(links, 'broaderSkill'), ...refs(links, 'broaderHierarchyConcept')],
    essentialFor: refs(links, 'isEssentialForOccupation'),
    optionalFor: refs(links, 'isOptionalForOccupation'),
  };
}
