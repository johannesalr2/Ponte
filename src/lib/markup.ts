/** Divide "Die [[id|Spindel]] läuft" em pedaços de texto e de termo destacado. */
export type Segment = { text: string; termId?: string };

export function parseMarkup(line: string): Segment[] {
  const out: Segment[] = [];
  const re = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
  let last = 0;
  for (const m of line.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: line.slice(last, i) });
    out.push({ text: m[2] ?? '', termId: m[1] });
    last = i + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last) });
  return out;
}

export const stripMarkup = (line: string) =>
  parseMarkup(line)
    .map((s) => s.text)
    .join('');
