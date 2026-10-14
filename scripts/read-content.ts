import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Lê todos os .json de /content em um mapa caminho relativo → JSON. */
export function readContentDir(root: string): Record<string, unknown> {
  const files: Record<string, unknown> = {};
  const walk = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.json')) {
        const rel = relative(root, full).split(sep).join('/');
        try {
          files[rel] = JSON.parse(readFileSync(full, 'utf8'));
        } catch (e) {
          throw new Error(`${rel}: JSON inválido — ${(e as Error).message}`);
        }
      }
    }
  };
  walk(root);
  return files;
}
