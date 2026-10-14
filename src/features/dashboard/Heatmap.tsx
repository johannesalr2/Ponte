import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/content/locale';
import { heatmapWeeks, parseDayKey, type HeatCell } from '@/lib/dates';
import type { DayRow } from '@/db/types';

const CELL = 12;
const GAP = 3;
const WEEKS = 53;

/**
 * Mapa de calor anual: um tom só, do claro (pouco) ao escuro (muito).
 * Cada célula tem tooltip ao passar o mouse/foco e há um resumo em texto.
 */
export function Heatmap({ days }: { days: DayRow[] }) {
  const { t, tp, date } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ cell: HeatCell; x: number; y: number } | null>(null);

  const counts = useMemo(() => new Map(days.map((d) => [d.date, d.reviews + d.exercises])), [days]);
  const grid = useMemo(() => heatmapWeeks(counts, WEEKS), [counts]);
  const activeDays = days.filter((d) => d.reviews + d.exercises > 0).length;
  const total = days.reduce((s, d) => s + d.reviews + d.exercises, 0);

  // começa mostrando as semanas mais recentes no celular
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const width = WEEKS * (CELL + GAP);
  const height = 7 * (CELL + GAP) + 16;
  const months: { x: number; label: string }[] = [];
  grid.forEach((col, w) => {
    const first = col[0];
    if (!first) return;
    const d = parseDayKey(first.date);
    if (d.getDate() <= 7) months.push({ x: w * (CELL + GAP), label: date(d, { month: 'short' }) });
  });

  const label = (c: HeatCell) =>
    `${date(parseDayKey(c.date), { day: 'numeric', month: 'long', year: 'numeric' })}: ${tp('heatmap.activities', c.count)}`;

  return (
    <figure className="relative">
      <figcaption className="text-muted mb-2 text-sm">
        {tp('heatmap.days', activeDays)} · {tp('heatmap.activities', total)}
      </figcaption>
      <div ref={scroller} className="overflow-x-auto pb-1" onMouseLeave={() => setHover(null)}>
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={t('heatmap.label')}
          className="block"
        >
          {months.map((m) => (
            <text
              key={m.x}
              x={m.x}
              y={10}
              className="fill-[var(--ink-muted)] font-mono text-[10px]"
            >
              {m.label}
            </text>
          ))}
          <g transform="translate(0 16)">
            {grid.map((col, w) =>
              col.map((cell, d) =>
                cell.future ? null : (
                  <rect
                    key={cell.date}
                    x={w * (CELL + GAP)}
                    y={d * (CELL + GAP)}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    fill={`var(--heat-${cell.level})`}
                    onMouseEnter={(e) => {
                      const box = (
                        e.currentTarget.ownerSVGElement?.parentElement as HTMLElement
                      ).getBoundingClientRect();
                      const r = e.currentTarget.getBoundingClientRect();
                      setHover({ cell, x: r.left - box.left + CELL / 2, y: r.top - box.top });
                    }}
                  >
                    <title>{label(cell)}</title>
                  </rect>
                ),
              ),
            )}
          </g>
        </svg>
      </div>
      {hover && (
        <div
          aria-hidden="true"
          className="border-line bg-surface pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow"
          style={{ left: hover.x, top: hover.y + 18 }}
        >
          {label(hover.cell)}
        </div>
      )}
      <div className="text-muted mt-2 flex items-center gap-1.5 text-xs" aria-hidden="true">
        {t('heatmap.less')}
        {[0, 1, 2, 3, 4].map((l) => (
          <span
            key={l}
            className="inline-block size-3 rounded-sm"
            style={{ background: `var(--heat-${l})` }}
          />
        ))}
        {t('heatmap.more')}
      </div>
    </figure>
  );
}
