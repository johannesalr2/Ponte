import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/content/locale';
import { Icon } from '@/components/Icon';
import type { LangPair } from './prefs';

/** Moldura da área ESCO: cabeçalho próprio, sem a navegação do app principal. */
export function EscoLayout({ pair, children }: { pair: LangPair | null; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="bg-bg text-ink min-h-dvh">
      <header className="border-line bg-surface sticky top-0 z-10 border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
          <Link to="/second" className="flex items-center gap-2.5">
            <span className="bg-primary text-primary-ink flex size-9 items-center justify-center rounded-lg">
              <Icon name="layers" className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-semibold tracking-tight">{t('esco.brand')}</span>
              <span className="text-accent block font-mono text-[0.6875rem] uppercase">
                {t('esco.experimental')}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {pair && (
              <Link
                to="/second/idiomas"
                className="border-line-strong hover:bg-surface-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 font-mono text-sm uppercase"
                aria-label={`${t('esco.langs.change')}: ${pair.learn} → ${pair.know}`}
              >
                {pair.learn} <span aria-hidden="true">↔</span> {pair.know}
              </Link>
            )}
            <a
              href="/"
              className="text-muted hover:bg-surface-2 inline-flex min-h-11 items-center rounded-lg px-2"
              aria-label={t('esco.backToApp')}
              title={t('esco.backToApp')}
            >
              <Icon name="bridge" />
            </a>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-4xl px-4 pt-6 pb-16 outline-none">
        {children}
      </main>
    </div>
  );
}
