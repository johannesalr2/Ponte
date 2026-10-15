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

/** Lista os arquivos de imagem em /content/media (caminhos relativos a /content). */
export function listMedia(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      return; // pasta ainda não existe
    }
    for (const name of names.sort()) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(webp|jpe?g|png|svg)$/i.test(name))
        out.push(relative(root, full).split(sep).join('/'));
    }
  };
  walk(join(root, 'media'));
  return out;
}
