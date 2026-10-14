/**
 * Normalização de texto para busca e correção de respostas.
 * Remove acentos e trema, troca ß por ss e une as grafias alternativas
 * do alemão (ä = ae, ö = oe, ü = ue), para que "Schluessel", "Schlussel"
 * e "Schlüssel" sejam a mesma chave.
 */

/** minúsculas, sem diacríticos, ß → ss, pontuação → espaço */
export function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** fold + grafia alternativa do trema (ae/oe/ue → a/o/u) */
export function searchKey(text: string): string {
  return fold(text).replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
}

export function tokens(text: string): string[] {
  return searchKey(text).split(' ').filter(Boolean);
}

/**
 * Distância de Damerau-Levenshtein (alinhamento ótimo de cadeias).
 * Para assim que a distância passa de `max`, devolvendo max + 1.
 */
export function editDistance(a: string, b: string, max = Infinity): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const n = b.length;
  let prev2: number[] = [];
  let prev: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = [i];
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, (prev2[j - 2] ?? 0) + 1);
      }
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[n] ?? 0;
}

/** Quantos erros de digitação toleramos para uma palavra deste tamanho. */
export function typoBudget(length: number): number {
  if (length <= 3) return 0;
  if (length <= 5) return 1;
  if (length <= 9) return 2;
  return 3;
}
