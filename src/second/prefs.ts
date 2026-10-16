import { useCallback, useSyncExternalStore } from 'react';
import { isEscoLang, type EscoLang } from './esco/languages';

/** Par de idiomas da página ESCO, guardado neste aparelho. */
export interface LangPair {
  learn: EscoLang;
  know: EscoLang;
}

const KEY = 'ponte-esco-langs';
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: LangPair | null } = { raw: null, value: null };

export function parsePair(raw: string | null): LangPair | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<LangPair>;
    return isEscoLang(v.learn) && isEscoLang(v.know) && v.learn !== v.know
      ? { learn: v.learn, know: v.know }
      : null;
  } catch {
    return null;
  }
}

function read(): LangPair | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // armazenamento bloqueado: pede os idiomas de novo
  }
  if (raw !== cached.raw) cached = { raw, value: parsePair(raw) };
  return cached.value;
}

let memory: LangPair | null = null; // usado se o localStorage falhar

export function useLangPair(): [LangPair | null, (p: LangPair) => void] {
  const pair = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => read() ?? memory,
  );
  const save = useCallback((p: LangPair) => {
    memory = p;
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      // segue só em memória
    }
    listeners.forEach((l) => l());
  }, []);
  return [pair, save];
}
