import { useRef, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useActiveProfile } from '@/app/profile';
import { useI18n } from '@/content/locale';
import { professions, useProfessionContent } from '@/content/loader';
import { Icon } from '@/components/Icon';
import { PageHeader, Panel, Spinner } from '@/components/ui';
import { cx } from '@/lib/cx';
import { CvBuilder } from './CvBuilder';

const TABS = ['equivalence', 'recognition', 'cv'] as const;
type Tab = (typeof TABS)[number];

export default function Career() {
  const profile = useActiveProfile();
  const { t, pick } = useI18n();
  const [params, setParams] = useSearchParams();
  const tab: Tab = (TABS as readonly string[]).includes(params.get('tab') ?? '')
    ? (params.get('tab') as Tab)
    : 'equivalence';
  const professionId = params.get('prof') ?? profile.profession;
  const content = useProfessionContent(professionId);
  const prof = professions.find((p) => p.id === professionId);
  const tr = pick(prof?.tr);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const setTab = (next: Tab) => {
    const p = new URLSearchParams(params);
    p.set('tab', next);
    setParams(p, { replace: true });
  };

  // setas esquerda/direita entre as abas (padrão WAI-ARIA)
  const onTabKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const j = (i + dir + TABS.length) % TABS.length;
    const next = TABS[j];
    if (next) setTab(next);
    tabRefs.current[j]?.focus();
  };

  if (!prof || !tr) return <Spinner label={t('common.loading')} />;

  return (
    <>
      <PageHeader kicker={t('career.kicker')} title={tr.name}>
        <label>
          <span className="sr-only">{t('glossary.profession')}</span>
          <select
            value={professionId}
            onChange={(e) => {
              const p = new URLSearchParams(params);
              if (e.target.value === profile.profession) p.delete('prof');
              else p.set('prof', e.target.value);
              setParams(p, { replace: true });
            }}
            className="border-line-strong bg-surface min-h-11 rounded-lg border px-3"
          >
            {professions.map((p) => (
              <option key={p.id} value={p.id}>
                {pick(p.tr)?.name ?? p.de}
              </option>
            ))}
          </select>
        </label>
      </PageHeader>

      <div
        role="tablist"
        aria-label={t('career.tabs')}
        className="border-line mb-4 flex gap-1 overflow-x-auto border-b"
      >
        {TABS.map((id, i) => (
          <button
            key={id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            onKeyDown={(e) => onTabKey(e, i)}
            className={cx(
              '-mb-px min-h-11 shrink-0 border-b-2 px-4 font-medium',
              tab === id
                ? 'border-primary text-primary'
                : 'text-muted hover:text-ink border-transparent',
            )}
          >
            {t(`career.tab.${id}` as const)}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0}>
        {tab === 'equivalence' && (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel className="p-5 md:col-span-2">
              <p lang="de" className="label-tech mb-1">
                {prof.de}
              </p>
              <p className="text-lg">{tr.summary}</p>
            </Panel>
            <Panel className="p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <Icon name="bridge" className="text-primary size-5" /> {t('career.brazil')}
              </h2>
              <ul className="mb-3 flex flex-col gap-1.5">
                {tr.brazil.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span aria-hidden="true" className="text-primary">
                      →
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <p className="text-muted">{tr.equivalence}</p>
            </Panel>
            <Panel className={cx('p-5', prof.regulated ? 'border-accent' : '')}>
              <h2 className="mb-3 font-semibold">{t('career.regulation')}</h2>
              <p
                className={cx(
                  'mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold',
                  prof.regulated ? 'bg-accent-soft text-accent' : 'bg-good-soft text-good',
                )}
              >
                <span aria-hidden="true">{prof.regulated ? '§' : '✓'}</span>
                {prof.regulated ? t('career.regulated') : t('career.notRegulated')}
              </p>
              <p className="text-muted">{tr.regulation}</p>
              <p className="text-muted mt-3 font-mono text-xs">ISCO-08 {prof.isco08}</p>
            </Panel>
          </div>
        )}

        {tab === 'recognition' && (
          <div className="grid gap-4 md:grid-cols-3">
            <Panel className="p-5 md:col-span-2">
              <h2 className="mb-1 font-semibold">{t('career.steps')}</h2>
              <p className="text-muted mb-4 text-sm">{tr.recognition.authority}</p>
              <ol className="flex flex-col gap-4">
                {tr.recognition.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="border-primary text-primary flex size-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-semibold">
                      {i + 1}
                    </span>
                    <span className="pt-1">{s}</span>
                  </li>
                ))}
              </ol>
              {tr.recognition.notes && (
                <p className="bg-surface-2 text-muted mt-5 rounded-lg p-3 text-sm">
                  {tr.recognition.notes}
                </p>
              )}
            </Panel>
            <div className="flex flex-col gap-4">
              {tr.recognition.documents.length > 0 && (
                <Panel className="p-5">
                  <h2 className="mb-3 font-semibold">{t('career.documents')}</h2>
                  <ul className="flex flex-col gap-2 text-sm">
                    {tr.recognition.documents.map((d) => (
                      <li key={d} className="flex gap-2">
                        <Icon name="check" className="text-good mt-0.5 size-4 shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
              <Panel className="p-5">
                <h2 className="mb-3 font-semibold">{t('career.links')}</h2>
                <ul className="flex flex-col gap-2 text-sm">
                  {tr.links.map((l) => (
                    <li key={l.url}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary inline-flex items-start gap-1.5 underline underline-offset-2"
                      >
                        {l.label}
                        <Icon name="external" className="mt-0.5 size-4 shrink-0" />
                        <span className="sr-only">{t('common.newTab')}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="text-muted mt-3 text-xs">{t('career.linksHint')}</p>
              </Panel>
            </div>
          </div>
        )}

        {tab === 'cv' &&
          (content ? <CvBuilder content={content} /> : <Spinner label={t('common.loading')} />)}
      </div>
    </>
  );
}
