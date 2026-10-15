import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useActiveProfile } from '@/app/profile';
import { useI18n } from '@/content/locale';
import { useProfessionContent } from '@/content/loader';
import { buildQueue, useCards, useDays, usePrefs } from '@/db/hooks';
import { dayKey, streak } from '@/lib/dates';
import { Icon } from '@/components/Icon';
import { ArticleBadge, LevelBadge, SpeakButton } from '@/components/term-bits';
import { withArticle } from '@/lib/term';
import { PageHeader, Panel, Spinner } from '@/components/ui';
import { Heatmap } from './Heatmap';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export default function Dashboard() {
  const profile = useActiveProfile();
  const prefs = usePrefs();
  const { t, tp, pick, termTr, number, locale } = useI18n();
  const content = useProfessionContent(profile.profession);
  const cards = useCards();
  const days = useDays();

  const today = dayKey(Date.now());
  const todayRow = days?.find((d) => d.date === today);
  const queue = useMemo(
    () => (cards ? buildQueue(cards, todayRow?.newCards ?? 0, prefs.newPerDay) : null),
    [cards, todayRow?.newCards, prefs.newPerDay],
  );
  const streakDays = useMemo(
    () => streak((days ?? []).filter((d) => d.reviews + d.exercises > 0).map((d) => d.date)),
    [days],
  );

  if (!content || !cards || !days || !queue) return <Spinner label={t('common.loading')} />;

  const termOfDay = content.terms[hash(today + profile.profession) % content.terms.length];
  const termTrans = termOfDay ? termTr(termOfDay) : undefined;
  const dueCount = queue.review.length + queue.learning.length + queue.fresh.length;
  const cardIds = new Map(cards.map((c) => [c.termId, c]));

  return (
    <>
      <PageHeader kicker={pick(content.profession.tr)?.name} title={t('dashboard.title')} />

      <div className="grid gap-4 md:grid-cols-3 [&>*]:min-w-0">
        <Panel className="flex flex-col gap-3 p-5 md:col-span-2">
          <p className="label-tech">{t('dashboard.today')}</p>
          <p className="text-4xl font-semibold tracking-tight">
            {number(dueCount)}{' '}
            <span className="text-muted text-lg font-normal">
              {tp('dashboard.cards', dueCount)}
            </span>
          </p>
          <p className="text-muted text-sm">
            {t('dashboard.breakdown', {
              review: number(queue.review.length + queue.learning.length),
              fresh: number(queue.fresh.length),
            })}
          </p>
          <Link
            to="/review"
            className="bg-primary text-primary-ink mt-1 inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-lg px-5 font-medium hover:brightness-110"
          >
            <Icon name="review" />
            {dueCount > 0 ? t('dashboard.startReview') : t('dashboard.addTerms')}
          </Link>
        </Panel>

        <Panel className="flex flex-col gap-2 p-5">
          <p className="label-tech">{t('dashboard.streak')}</p>
          <p className="flex items-center gap-2 text-4xl font-semibold tracking-tight">
            <Icon
              name="flame"
              className={streakDays > 0 ? 'text-accent size-8' : 'text-muted size-8'}
            />
            {number(streakDays)}
          </p>
          <p className="text-muted text-sm">
            {streakDays > 0 ? tp('dashboard.streakDays', streakDays) : t('dashboard.streakZero')}
          </p>
        </Panel>

        {termOfDay && termTrans && (
          <Panel className="p-5 md:col-span-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="label-tech">{t('dashboard.termOfDay')}</p>
              <LevelBadge level={termOfDay.level} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ArticleBadge article={termOfDay.de.article} size="lg" />
              <span lang="de" className="text-2xl font-semibold break-all sm:text-3xl">
                {termOfDay.de.word}
              </span>
              <SpeakButton text={withArticle(termOfDay)} />
            </div>
            <p
              className={
                prefs.focus === 'locale'
                  ? 'mt-2 flex items-center gap-1 text-2xl font-semibold'
                  : 'mt-2 text-lg'
              }
            >
              {termTrans.term}
              {prefs.focus === 'locale' && (
                <SpeakButton text={termTrans.term} lang={locale.speechLang} />
              )}
            </p>
            <p className="text-muted mt-1">
              {prefs.explanation === 'simple' ? termTrans.simple : termTrans.technical}
            </p>
            <Link
              to={`/glossary/${termOfDay.id}`}
              className="text-primary mt-3 inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
            >
              {t('dashboard.openTerm')} <Icon name="chevron" className="size-4" />
            </Link>
          </Panel>
        )}

        <Panel className="p-5 md:col-span-3">
          <h2 className="mb-3 text-lg font-semibold">{t('dashboard.year')}</h2>
          <Heatmap days={days} />
        </Panel>

        <Panel className="p-5 md:col-span-3">
          <h2 className="mb-1 text-lg font-semibold">{t('dashboard.progress')}</h2>
          <p className="text-muted mb-4 text-sm">{t('dashboard.progressHint')}</p>
          <ul className="flex flex-col gap-4">
            {content.profession.areas.map((area) => {
              const terms = content.terms.filter((tm) => tm.area === area.id);
              const learned = terms.filter((tm) => cardIds.get(tm.id)?.state === 'review').length;
              const studying = terms.filter((tm) => {
                const s = cardIds.get(tm.id)?.state;
                return s && s !== 'review';
              }).length;
              const pct = terms.length ? Math.round((learned / terms.length) * 100) : 0;
              return (
                <li key={area.id}>
                  <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3">
                    <Link to={`/glossary?area=${area.id}`} className="font-medium hover:underline">
                      {pick(area.tr)}
                    </Link>
                    <span className="text-muted text-sm">
                      {t('dashboard.areaCount', {
                        learned: number(learned),
                        total: number(terms.length),
                        studying: number(studying),
                      })}
                    </span>
                  </div>
                  <div
                    className="bg-surface-2 h-2.5 overflow-hidden rounded-full"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={pick(area.tr)}
                  >
                    <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </>
  );
}
