import { describe, expect, it } from 'vitest';
import { addDays, dayKey, heatmapWeeks, streak } from '../src/lib/dates';

const today = new Date(2026, 9, 14, 15, 0); // quarta-feira, 14/10/2026
const k = (offset: number) => dayKey(addDays(today, offset));

describe('sequência de estudo', () => {
  it('conta dias seguidos até hoje', () => {
    expect(streak([k(0), k(-1), k(-2), k(-4)], today)).toBe(3);
  });

  it('não quebra se hoje ainda não teve estudo', () => {
    expect(streak([k(-1), k(-2)], today)).toBe(2);
  });

  it('é zero quando ontem e hoje ficaram em branco', () => {
    expect(streak([k(-2), k(-3)], today)).toBe(0);
    expect(streak([], today)).toBe(0);
  });
});

describe('mapa de calor', () => {
  it('gera semanas de segunda a domingo terminando na semana atual', () => {
    const grid = heatmapWeeks(
      new Map([
        [k(0), 4],
        [k(-1), 1],
      ]),
      53,
      today,
    );
    expect(grid).toHaveLength(53);
    const last = grid[52] ?? [];
    expect(last).toHaveLength(7);
    expect(last[0]?.date).toBe('2026-10-12'); // segunda
    expect(last[2]?.date).toBe('2026-10-14');
    expect(last[2]?.level).toBe(4);
    expect(last[1]?.level).toBe(1);
    expect(last[3]?.future).toBe(true);
    expect(grid[0]?.[0]?.level).toBe(0);
  });
});
