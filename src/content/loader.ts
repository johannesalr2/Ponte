import { useSyncExternalStore } from 'react';
import type { LocaleSource, Profession, Situation, SituationFile, Term, TermFile } from './schema';

/**
 * Carregamento do conteúdo de /content. Profissões e idiomas são pequenos e
 * vêm junto com o app; termos e situações são carregados sob demanda, um
 * pedaço (chunk) por arquivo, e ficam em cache.
 */

const professionModules = import.meta.glob<Profession>('/content/professions/*/profession.json', {
  eager: true,
  import: 'default',
});
const localeModules = import.meta.glob<LocaleSource>('/content/locales/*.json', {
  eager: true,
  import: 'default',
});
const termLoaders = import.meta.glob<TermFile>('/content/professions/*/terms/*.json', {
  import: 'default',
});
const situationLoaders = import.meta.glob<SituationFile>('/content/professions/*/situations.json', {
  import: 'default',
});

const mediaUrls = import.meta.glob<string>('/content/media/**/*.{webp,jpg,jpeg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** URL final (com hash) de uma foto declarada como "media/<profissão>/<arquivo>". */
export function mediaUrl(file: string): string | undefined {
  return mediaUrls[`/content/${file}`];
}

export const professions: Profession[] = Object.values(professionModules).sort(
  (a, b) => a.order - b.order,
);
export const locales: LocaleSource[] = Object.values(localeModules);

export function getProfession(id: string): Profession | undefined {
  return professions.find((p) => p.id === id);
}

export interface ProfessionContent {
  profession: Profession;
  terms: Term[];
  byId: Map<string, Term>;
  situations: Situation[];
}

const cache = new Map<string, ProfessionContent>();
const pending = new Map<string, Promise<ProfessionContent>>();
const listeners = new Set<() => void>();
let version = 0;

function notify() {
  version++;
  listeners.forEach((l) => l());
}

export function loadProfession(id: string): Promise<ProfessionContent> {
  const cached = cache.get(id);
  if (cached) return Promise.resolve(cached);
  const inflight = pending.get(id);
  if (inflight) return inflight;
  const profession = getProfession(id);
  if (!profession) return Promise.reject(new Error(`Profissão desconhecida: ${id}`));

  const prefix = `/content/professions/${id}/`;
  const promise = (async () => {
    const files = await Promise.all(
      Object.entries(termLoaders)
        .filter(([path]) => path.startsWith(`${prefix}terms/`))
        .map(([, load]) => load()),
    );
    const areaOrder = new Map(profession.areas.map((a, i) => [a.id, i]));
    const terms: Term[] = files
      .sort((a, b) => (areaOrder.get(a.area) ?? 0) - (areaOrder.get(b.area) ?? 0))
      .flatMap((f) => f.terms.map((t) => ({ ...t, profession: id, area: f.area })));
    const sitLoader = situationLoaders[`${prefix}situations.json`];
    const situations = sitLoader ? (await sitLoader()).situations : [];
    const content: ProfessionContent = {
      profession,
      terms,
      byId: new Map(terms.map((t) => [t.id, t])),
      situations,
    };
    cache.set(id, content);
    pending.delete(id);
    notify();
    return content;
  })();
  pending.set(id, promise);
  return promise;
}

export function loadAllProfessions(): Promise<ProfessionContent[]> {
  return Promise.all(professions.map((p) => loadProfession(p.id)));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Conteúdo de uma profissão; `undefined` enquanto carrega (dispara o carregamento). */
export function useProfessionContent(id: string | undefined): ProfessionContent | undefined {
  useSyncExternalStore(subscribe, () => version);
  if (!id) return undefined;
  const content = cache.get(id);
  if (!content && !pending.has(id)) void loadProfession(id);
  return content;
}

/** Todos os termos já carregados, indexados por id. */
export function useLoadedTerms(ids: string[]): Map<string, Term> {
  useSyncExternalStore(subscribe, () => version);
  const map = new Map<string, Term>();
  for (const c of cache.values())
    for (const id of ids) {
      const t = c.byId.get(id);
      if (t) map.set(id, t);
    }
  return map;
}

export function findTerm(id: string): Term | undefined {
  for (const c of cache.values()) {
    const t = c.byId.get(id);
    if (t) return t;
  }
  return undefined;
}
