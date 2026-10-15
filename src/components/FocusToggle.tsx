import { useI18n } from '@/content/locale';
import { savePrefs, usePrefs } from '@/db/hooks';
import type { Focus } from '@/lib/exercises';
import { cx } from '@/lib/cx';

/**
 * Alterna o idioma em foco: o que o usuário quer aprender a produzir.
 * "DE" = treinar os termos em alemão; "PT" = treinar no idioma de explicação.
 */
export function FocusToggle({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const prefs = usePrefs();
  const options: { value: Focus; short: string; long: string }[] = [
    { value: 'de', short: 'DE', long: t('focus.de') },
    { value: 'locale', short: t('app.langShort'), long: t('focus.locale') },
  ];
  return (
    <div className={cx('flex items-center gap-2', compact ? '' : 'flex-col items-stretch')}>
      {!compact && <span className="label-tech">{t('focus.label')}</span>}
      <div
        role="group"
        aria-label={t('focus.label')}
        className="border-line-strong bg-surface flex rounded-lg border p-0.5"
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={prefs.focus === o.value}
            title={o.long}
            onClick={() => void savePrefs({ focus: o.value })}
            className={cx(
              'min-h-9 flex-1 rounded-md px-3 text-sm font-medium',
              prefs.focus === o.value
                ? 'bg-primary text-primary-ink'
                : 'text-ink hover:bg-surface-2',
            )}
          >
            {compact ? (
              <>
                <span aria-hidden="true">{o.short}</span>
                <span className="sr-only">{o.long}</span>
              </>
            ) : (
              o.long
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
