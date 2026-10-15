import type { Article, Level, ReviewStatus } from '@/content/schema';
import { useI18n } from '@/content/locale';
import { speak, speechSupported } from '@/lib/speech';
import { Icon } from './Icon';
import {} from './ui';
import { cx } from '@/lib/cx';

const ARTICLE_STYLE: Record<Article, string> = {
  der: 'bg-der-soft text-der border-der rounded-none',
  die: 'bg-die-soft text-die border-die rounded-full',
  das: 'bg-das-soft text-das border-das shape-das',
};

/**
 * Artigo com cor, texto e formato próprios (quadrado, pílula, chanfrado),
 * para não depender só da cor.
 */
export function ArticleBadge({
  article,
  size = 'md',
}: {
  article: Article | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const { t } = useI18n();
  if (!article) return null;
  return (
    <span
      className={cx(
        'inline-flex items-center justify-center border font-mono font-semibold',
        size === 'sm' && 'h-6 min-w-9 px-1.5 text-xs',
        size === 'md' && 'h-7 min-w-11 px-2 text-sm',
        size === 'lg' && 'h-10 min-w-16 px-3 text-lg',
        ARTICLE_STYLE[article],
      )}
      title={t(`article.${article}` as const)}
    >
      {article}
    </span>
  );
}

export function LevelBadge({ level }: { level: Level }) {
  return (
    <span className="border-line-strong text-muted inline-flex h-6 items-center rounded border px-1.5 font-mono text-xs">
      {level}
    </span>
  );
}

export function StatusBadge({ status }: { status: ReviewStatus }) {
  const { t } = useI18n();
  const style =
    status === 'revisado-profissional'
      ? 'border-good text-good'
      : status === 'revisado-ia'
        ? 'border-primary text-primary'
        : 'border-accent text-accent';
  const icon = status === 'rascunho' ? '✎' : '✓';
  return (
    <span className={cx('inline-flex h-6 items-center gap-1 rounded border px-1.5 text-xs', style)}>
      <span aria-hidden="true">{icon}</span>
      {t(`status.${status}` as const)}
    </span>
  );
}

/** Ouvir em alemão (padrão) ou, com `lang`, no idioma de explicação. */
export function SpeakButton({
  text,
  className,
  lang = 'de-DE',
}: {
  text: string;
  className?: string;
  lang?: string;
}) {
  const { t } = useI18n();
  if (!speechSupported()) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text, lang);
      }}
      className={cx(
        'text-primary hover:bg-primary-soft inline-flex size-10 shrink-0 items-center justify-center rounded-full',
        className,
      )}
      aria-label={t('term.listen', { word: text })}
    >
      <Icon name="speaker" />
    </button>
  );
}
