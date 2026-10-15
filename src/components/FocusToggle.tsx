import { useI18n } from '@/content/locale';
import { savePrefs, usePrefs } from '@/db/hooks';
import type { Focus } from '@/lib/exercises';
import { cx } from '@/lib/cx';

/**
 * Alterna o idioma em foco: o que o usuário quer aprender a produzir
 * (os termos em alemão ou no idioma de explicação). Fica na aba Praticar e nos Ajustes.
 */
export function FocusToggle() {
  const { t } = useI18n();
  const prefs = usePrefs();
  const options: { value: Focus; label: string }[] = [
    { value: 'de', label: t('focus.de') },
    { value: 'locale', label: t('focus.locale') },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-tech">{t('focus.label')}</span>
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
            onClick={() => void savePrefs({ focus: o.value })}
            className={cx(
              'min-h-9 flex-1 rounded-md px-3 text-sm font-medium',
              prefs.focus === o.value
                ? 'bg-primary text-primary-ink'
                : 'text-ink hover:bg-surface-2',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
