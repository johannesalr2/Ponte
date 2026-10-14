/** Datas locais (o "dia" do usuário, não UTC). */

export function dayKey(date: Date | number): string {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseDayKey(key: string): Date {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function endOfDay(date: Date | number): number {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * Dias seguidos com estudo, terminando hoje (ou ontem, se hoje ainda não
 * houve estudo — a sequência só quebra quando um dia inteiro passa em branco).
 */
export function streak(activeDays: Iterable<string>, today: Date = new Date()): number {
  const set = new Set(activeDays);
  let cursor = set.has(dayKey(today)) ? today : addDays(today, -1);
  let count = 0;
  while (set.has(dayKey(cursor))) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export interface HeatCell {
  date: string;
  count: number;
  /** 0 a 4 */
  level: number;
  future: boolean;
}

/**
 * Grade do mapa de calor: semanas (colunas) × dias (linhas, segunda a domingo),
 * terminando na semana de `today`.
 */
export function heatmapWeeks(
  counts: Map<string, number>,
  weeks: number,
  today: Date = new Date(),
): HeatCell[][] {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const weekday = (start.getDay() + 6) % 7; // segunda = 0
  const firstMonday = addDays(start, -weekday - (weeks - 1) * 7);
  const max = Math.max(1, ...counts.values());
  const todayKey = dayKey(today);
  const grid: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = dayKey(addDays(firstMonday, w * 7 + d));
      const count = counts.get(date) ?? 0;
      const level = count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4));
      col.push({ date, count, level, future: date > todayKey });
    }
    grid.push(col);
  }
  return grid;
}
