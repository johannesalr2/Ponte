import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useI18n, type UiKey } from '@/content/locale';
import { FocusToggle } from './FocusToggle';
import { Icon, type IconName } from './Icon';
import {} from './ui';
import { cx } from '@/lib/cx';

interface NavItem {
  to: string;
  label: UiKey;
  icon: IconName;
}

const MAIN: NavItem[] = [
  { to: '/', label: 'nav.home', icon: 'home' },
  { to: '/glossary', label: 'nav.glossary', icon: 'book' },
  { to: '/review', label: 'nav.review', icon: 'review' },
  { to: '/practice', label: 'nav.practice', icon: 'practice' },
];
const MORE: NavItem[] = [
  { to: '/situations', label: 'nav.situations', icon: 'chat' },
  { to: '/career', label: 'nav.career', icon: 'career' },
  { to: '/settings', label: 'nav.settings', icon: 'settings' },
];

function Brand() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2.5">
      <span className="bg-primary text-primary-ink flex size-9 items-center justify-center rounded-lg">
        <Icon name="bridge" className="size-6" />
      </span>
      <span className="leading-tight">
        <span className="block font-semibold tracking-tight">{t('app.name')}</span>
        <span className="text-muted block font-mono text-[0.6875rem]">
          DE ↔ {t('app.langShort')}
        </span>
      </span>
    </div>
  );
}

function SideLink({ item }: { item: NavItem }) {
  const { t } = useI18n();
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cx(
          'flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.95rem] transition-colors',
          isActive ? 'bg-primary-soft text-primary font-semibold' : 'text-ink hover:bg-surface-2',
        )
      }
    >
      <Icon name={item.icon} />
      {t(item.label)}
    </NavLink>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const moreActive = MORE.some((m) => pathname.startsWith(m.to));

  return (
    <div className="min-h-dvh md:flex">
      <a href="#main" className="skip-link bg-primary text-primary-ink rounded px-3 py-2">
        {t('nav.skip')}
      </a>

      {/* barra lateral (desktop) */}
      <aside className="border-line bg-surface/80 sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r p-4 backdrop-blur md:flex">
        <Brand />
        <FocusToggle />
        <nav aria-label={t('nav.label')} className="flex flex-col gap-1">
          {[...MAIN, ...MORE].map((item) => (
            <SideLink key={item.to} item={item} />
          ))}
        </nav>
        <p className="text-muted mt-auto text-xs">{t('app.offline')}</p>
      </aside>

      {/* topo (celular) */}
      <header className="border-line bg-surface/90 flex items-center justify-between border-b px-4 py-2.5 backdrop-blur md:hidden">
        <Brand />
        <FocusToggle compact />
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-12"
      >
        {children}
      </main>

      {/* navegação inferior (celular) */}
      <nav
        aria-label={t('nav.label')}
        className="border-line bg-surface fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {moreOpen && (
          <div id="more-menu" className="border-line border-b p-2">
            {MORE.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cx(
                    'flex min-h-12 items-center gap-3 rounded-lg px-3',
                    isActive ? 'bg-primary-soft text-primary font-semibold' : 'text-ink',
                  )
                }
              >
                <Icon name={item.icon} />
                {t(item.label)}
              </NavLink>
            ))}
          </div>
        )}
        <ul className="grid grid-cols-5">
          {MAIN.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cx(
                    'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem]',
                    isActive ? 'text-primary font-semibold' : 'text-muted',
                  )
                }
              >
                <Icon name={item.icon} />
                {t(item.label)}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls="more-menu"
              onClick={() => setMoreOpen((o) => !o)}
              className={cx(
                'flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[0.6875rem]',
                moreActive || moreOpen ? 'text-primary font-semibold' : 'text-muted',
              )}
            >
              <Icon name="more" />
              {t('nav.more')}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
