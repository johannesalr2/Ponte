import { describe, expect, it } from 'vitest';
import {
  DAY,
  DEFAULT_PARAMS,
  forgetStability,
  formatInterval,
  initDifficulty,
  initStability,
  newCard,
  nextDifficulty,
  nextInterval,
  preview,
  recallStability,
  retrievability,
  schedule,
  type FsrsCard,
  type Rating,
} from '../src/lib/fsrs';

const NOW = Date.UTC(2026, 0, 10, 9, 0, 0);

/** leva um cartão novo até o estado de revisão com "Bom, Bom" */
function graduated(): FsrsCard {
  const a = schedule(newCard(NOW), 3, NOW).card;
  return schedule(a, 3, a.due).card;
}

describe('fórmulas FSRS-5', () => {
  it('recuperabilidade é 1 no momento da revisão e 0,9 após S dias', () => {
    expect(retrievability(0, 5)).toBe(1);
    expect(retrievability(5, 5)).toBeCloseTo(0.9, 10);
    expect(retrievability(50, 5)).toBeLessThan(0.9);
  });

  it('com retenção de 90% o intervalo é igual à estabilidade', () => {
    expect(nextInterval(1)).toBe(1);
    expect(nextInterval(10)).toBe(10);
    expect(nextInterval(123.4)).toBe(123);
  });

  it('intervalo respeita mínimo de 1 dia e o máximo configurado', () => {
    expect(nextInterval(0.1)).toBe(1);
    expect(nextInterval(1e9)).toBe(DEFAULT_PARAMS.maximumInterval);
  });

  it('retenção maior gera intervalos menores', () => {
    const strict = { ...DEFAULT_PARAMS, requestRetention: 0.95 };
    expect(nextInterval(20, strict)).toBeLessThan(nextInterval(20));
  });

  it('estabilidade inicial cresce com a nota', () => {
    const s = ([1, 2, 3, 4] as Rating[]).map((g) => initStability(g));
    expect(s).toEqual([...s].sort((a, b) => a - b));
    expect(s[0]).toBeCloseTo(0.40255);
    expect(s[3]).toBeCloseTo(15.69105);
  });

  it('dificuldade inicial cai com a nota e fica entre 1 e 10', () => {
    const d = ([1, 2, 3, 4] as Rating[]).map((g) => initDifficulty(g));
    expect(d[0]).toBeGreaterThan(d[1] ?? 0);
    expect(d[1]).toBeGreaterThan(d[2] ?? 0);
    for (const v of d) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('dificuldade sobe com "Errei", desce com "Fácil" e nunca sai de [1, 10]', () => {
    expect(nextDifficulty(5, 1)).toBeGreaterThan(5);
    expect(nextDifficulty(5, 4)).toBeLessThan(5);
    let d = 5;
    for (let i = 0; i < 50; i++) d = nextDifficulty(d, 1);
    expect(d).toBeLessThanOrEqual(10);
    for (let i = 0; i < 50; i++) d = nextDifficulty(d, 4);
    expect(d).toBeGreaterThanOrEqual(1);
  });

  it('lembrar aumenta a estabilidade; esquecer nunca aumenta', () => {
    expect(recallStability(5, 10, 0.9, 3)).toBeGreaterThan(10);
    expect(recallStability(5, 10, 0.9, 2)).toBeLessThan(recallStability(5, 10, 0.9, 3));
    expect(recallStability(5, 10, 0.9, 4)).toBeGreaterThan(recallStability(5, 10, 0.9, 3));
    expect(forgetStability(5, 10, 0.9)).toBeLessThanOrEqual(10);
  });

  it('lembrar com recuperabilidade menor aumenta mais a estabilidade', () => {
    expect(recallStability(5, 10, 0.6, 3)).toBeGreaterThan(recallStability(5, 10, 0.95, 3));
  });
});

describe('agendamento', () => {
  it('cartão novo: Errei/Difícil/Bom ficam em passos curtos, Fácil vai para revisão', () => {
    const p = preview(newCard(NOW), NOW);
    expect(p[1].state).toBe('learning');
    expect(p[1].due - NOW).toBe(60_000);
    expect(p[2].due - NOW).toBe(5 * 60_000);
    expect(p[3].due - NOW).toBe(10 * 60_000);
    expect(p[4].state).toBe('review');
    expect(p[4].scheduledDays).toBe(16);
  });

  it('cartão em aprendizagem gradua com "Bom" para dias', () => {
    const c = graduated();
    expect(c.state).toBe('review');
    expect(c.scheduledDays).toBeGreaterThanOrEqual(1);
    expect(c.reps).toBe(2);
  });

  it('em revisão os intervalos são ordenados: Difícil < Bom < Fácil', () => {
    const c = graduated();
    const later = c.due + 2 * DAY;
    const p = preview(c, later);
    expect(p[2].scheduledDays).toBeLessThan(p[3].scheduledDays);
    expect(p[3].scheduledDays).toBeLessThan(p[4].scheduledDays);
    expect(p[1].state).toBe('relearning');
  });

  it('"Errei" em revisão conta um lapso e reduz a estabilidade', () => {
    const c = graduated();
    const { card, log } = schedule(c, 1, c.due);
    expect(card.lapses).toBe(1);
    expect(card.stability).toBeLessThanOrEqual(c.stability);
    expect(log.state).toBe('review');
    expect(log.rating).toBe(1);
  });

  it('revisões "Bom" sucessivas aumentam os intervalos', () => {
    let c = graduated();
    const intervals: number[] = [];
    for (let i = 0; i < 6; i++) {
      c = schedule(c, 3, c.due).card;
      intervals.push(c.scheduledDays);
    }
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThan(intervals[i - 1] ?? 0);
    }
  });

  it('não altera o cartão original (função pura)', () => {
    const c = newCard(NOW);
    const copy = { ...c };
    schedule(c, 3, NOW);
    expect(c).toEqual(copy);
  });

  it('formata intervalos para os botões', () => {
    expect(formatInterval({ ...newCard(NOW), due: NOW + 10 * 60_000 }, NOW)).toEqual({
      value: 10,
      unit: 'min',
    });
    expect(formatInterval({ ...newCard(NOW), due: NOW + 3 * DAY }, NOW)).toEqual({
      value: 3,
      unit: 'd',
    });
    expect(formatInterval({ ...newCard(NOW), due: NOW + 90 * DAY }, NOW)).toEqual({
      value: 3,
      unit: 'mo',
    });
  });
});
