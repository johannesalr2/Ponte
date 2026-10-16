import { useEffect, useState } from 'react';
import { esco } from './esco/config';
import type { EscoLang } from './esco/languages';
import type { Skill } from './esco/types';

/**
 * Busca os detalhes (tipo, rótulos em todos os idiomas) de várias habilidades,
 * poucas por vez para não sobrecarregar a API. Devolve o que já chegou.
 */
export function useSkills(uris: string[], lang: EscoLang, concurrency = 4) {
  const key = uris.join('|');
  const [skills, setSkills] = useState<Map<string, Skill>>(new Map());
  const [failed, setFailed] = useState(0);

  useEffect(() => {
    let alive = true;
    const queue = key ? key.split('|') : [];
    const found = new Map<string, Skill>();
    setSkills(new Map());
    setFailed(0);
    const worker = async () => {
      for (let uri = queue.shift(); uri; uri = queue.shift()) {
        try {
          const s = await esco.skill(uri, lang);
          if (!alive) return;
          found.set(uri, s);
          setSkills(new Map(found));
        } catch {
          if (alive) setFailed((n) => n + 1);
        }
      }
    };
    void Promise.all(Array.from({ length: concurrency }, worker));
    return () => {
      alive = false;
    };
  }, [key, lang, concurrency]);

  return { skills, done: skills.size + failed, total: uris.length };
}
