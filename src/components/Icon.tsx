/** Ícones de traço simples (24×24), desenhados para o app. Decorativos por padrão. */
const PATHS = {
  home: 'M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 19a2 2 0 012-2h13M8 7h7M8 11h5',
  review: 'M4 7h12v13H4zM8 4h12v13M8 13l2 2 4-4',
  practice: 'M5 4h6v6H5zM13 14h6v6h-6zM16 4l4 4-4 4M8 20l-4-4 4-4',
  chat: 'M4 5h16v10H9l-5 4zM8 9h8M8 12h5',
  career: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  settings: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
  speaker: 'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11',
  check: 'M5 12l5 5L20 7',
  x: 'M6 6l12 12M18 6L6 18',
  chevron: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  flame: 'M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-3 2-4 2-6 2 1 3 2 3 4 0-3-1-5 0-8z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  copy: 'M8 8h11v12H8zM5 16V4h11',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  bridge: 'M3 16h18M5 16c2-6 5-9 7-9s5 3 7 9M7 16v4M17 16v4',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  layers: 'M12 4l9 5-9 5-9-5zM3 14l9 5 9-5',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = 'size-5',
  label,
}: {
  name: IconName;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
