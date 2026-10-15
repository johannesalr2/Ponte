/**
 * Busca de fotos no Wikimedia Commons, aceitando apenas CC0 e domínio público.
 * Usa o curl do sistema (respeita o proxy configurado no ambiente).
 */
import { execFileSync } from 'node:child_process';

export type FreeLicense = 'CC0' | 'Public Domain';

export interface Candidate {
  title: string;
  thumbUrl: string;
  source: string;
  author: string;
  license: FreeLicense;
  mime: string;
}

interface ExtValue {
  value?: string;
}
interface ImageInfo {
  thumburl?: string;
  descriptionurl?: string;
  mime?: string;
  extmetadata?: Record<string, ExtValue | undefined>;
}
interface ApiResponse {
  query?: { pages?: Record<string, { title: string; index?: number; imageinfo?: ImageInfo[] }> };
}

export function curl(url: string, binary = false): Buffer | string {
  const out = execFileSync(
    'curl',
    ['-sS', '-L', '--fail', '-m', '60', '-A', 'PonteTecnica/0.1 (glossario educacional)', url],
    {
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return binary ? out : out.toString('utf8');
}

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** Classifica a licença pelos metadados do Commons; null se não for livre de direitos. */
export function freeLicense(meta: Record<string, ExtValue | undefined>): FreeLicense | null {
  const code = (meta.License?.value ?? '').toLowerCase();
  const short = (meta.LicenseShortName?.value ?? '').toLowerCase();
  if (code === 'cc0' || short.startsWith('cc0')) return 'CC0';
  if (code === 'pd' || code.startsWith('pd-') || short.startsWith('public domain'))
    return 'Public Domain';
  return null;
}

export function searchFreeImages(query: string, limit = 3, width = 640): Candidate[] {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '25',
    gsrsearch: `${query} filetype:bitmap`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: String(width),
  });
  const json = JSON.parse(
    curl(`https://commons.wikimedia.org/w/api.php?${params}`) as string,
  ) as ApiResponse;
  const pages = Object.values(json.query?.pages ?? {}).sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  );
  const out: Candidate[] = [];
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info?.thumburl || !info.descriptionurl || !info.extmetadata) continue;
    if (!/image\/(jpeg|png|webp)/.test(info.mime ?? '')) continue;
    const license = freeLicense(info.extmetadata);
    if (!license) continue;
    out.push({
      title: p.title,
      thumbUrl: info.thumburl,
      source: info.descriptionurl,
      author:
        stripHtml(info.extmetadata.Artist?.value ?? '') || 'Autor desconhecido (Wikimedia Commons)',
      license,
      mime: info.mime ?? '',
    });
    if (out.length >= limit) break;
  }
  return out;
}
