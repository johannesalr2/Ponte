import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveProfile } from '@/app/profile';
import { useI18n } from '@/content/locale';
import { loadProfession, useLoadedTerms, useProfessionContent } from '@/content/loader';
import { db } from '@/db/db';
import { addCard, buildQueue, rateCard, useCards, useDays, usePrefs } from '@/db/hooks';
import type { CardRow } from '@/db/types';
import { dayKey } from '@/lib/dates';
import { formatInterval, preview, RATINGS, type Rating } from '@/lib/fsrs';
import { pickNewTerms } from '@/lib/newTerms';
import { Icon } from '@/components/Icon';
import { ArticleBadge, LevelBadge, SpeakButton } from '@/components/term-bits';
import { withArticle } from '@/lib/term';
import { Button, PageHeader, Panel, Spinner } from '@/components/ui';
import { cx } from '@/lib/cx';

const RATING_STYLE: Record<Rating, string> = {
  1: 'border-bad text-bad hover:bg-bad-soft',
  2: 'border-accent text-accent hover:bg-accent-soft',
  3: 'border-good text-good hover:bg-good-soft',
  4: 'border-primary text-primary hover:bg-primary-soft',
};

export default function Review() {
  const profile = useActiveProfile();
  const prefs = usePrefs();
  const { t, tp, termTr, pick, number } = useI18n();
  const content = useProfessionContent(profile.profession);
  const cards = useCards();
  const days = useDays();
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const toppedUp = useRef(false);

  const newToday = days?.find((d) => d.date === dayKey(now))?.newCards ?? 0;
  const queue = useMemo(
    () => (cards ? buildQueue(cards, newToday, prefs.newPerDay, now) : null),
    [cards, newToday, prefs.newPerDay, now],
  );

  // completa a fila com termos novos da profissão, até o limite diário
  useEffect(() => {
    if (!content || !cards || !queue || toppedUp.current) return;
    toppedUp.current = true;
    const missing = prefs.newPerDay - newToday - queue.fresh.length;
    if (missing <= 0) return;
    const carded = new Set(cards.map((c) => c.termId));
    const picks = pickNewTerms(content.terms, carded, profile.level, missing);
    void db.transaction('rw', db.cards, async () => {
      const base = Date.now();
      for (const [i, term] of picks.entries()) await addCard(term.id, term.profession, base + i);
    });
  }, [content, cards, queue, prefs.newPerDay, newToday, profile.level]);

  // cartões de outras profissões (adicionados pelo glossário)
  useEffect(() => {
    const profs = new Set(cards?.map((c) => c.profession));
    profs.forEach((p) => void loadProfession(p).catch(() => undefined));
  }, [cards]);

  // passos curtos: reavalia a fila a cada 15 s
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const current: CardRow | undefined =
    queue?.all.find((c) => c.due <= now + 20 * 60_000) ?? undefined;
  const termMap = useLoadedTerms(current ? [current.termId] : []);
  const term = current ? termMap.get(current.termId) : undefined;
  const options = useMemo(() => (current ? preview(current, Date.now()) : null), [current]);

  const rate = useCallback(
    async (rating: Rating) => {
      if (!current || busy) return;
      setBusy(true);
      await rateCard(current, rating);
      setFlipped(false);
      setNow(Date.now());
      setBusy(false);
    },
    [current, busy],
  );

  // atalhos: espaço vira o cartão (ou "Bom" se já virado); 1–4 dão a nota
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ' ' || e.code === 'Space') {
        if (target.closest('button, a') && target.id !== 'show-answer') return;
        e.preventDefault();
        if (!flipped) setFlipped(true);
        else void rate(3);
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        void rate(Number(e.key) as Rating);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, rate]);

  if (!queue || !content) return <Spinner label={t('common.loading')} />;

  const remaining = queue.all.length;

  if (!current) {
    const nextLearning = cards
      ?.filter((c) => c.state === 'learning' || c.state === 'relearning')
      .sort((a, b) => a.due - b.due)[0];
    return (
      <>
        <PageHeader kicker={t('review.kicker')} title={t('review.title')} />
        <Panel className="flex flex-col items-center gap-3 p-8 text-center">
          <span className="bg-good-soft text-good flex size-14 items-center justify-center rounded-full">
            <Icon name="check" className="size-8" />
          </span>
          <h2 className="text-xl font-semibold">{t('review.done')}</h2>
          <p className="text-muted max-w-md">
            {nextLearning
              ? t('review.doneLearning', {
                  value: formatInterval(nextLearning, now).value,
                  unit: t(`unit.${formatInterval(nextLearning, now).unit}` as const),
                })
              : t('review.doneHint')}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/practice"
              className="bg-primary text-primary-ink inline-flex min-h-11 items-center rounded-lg px-4 font-medium"
            >
              {t('review.goPractice')}
            </Link>
            <Link
              to="/glossary"
              className="border-line-strong bg-surface inline-flex min-h-11 items-center rounded-lg border px-4"
            >
              {t('review.goGlossary')}
            </Link>
          </div>
        </Panel>
      </>
    );
  }

  const tr = term ? termTr(term) : undefined;
  const isNew = current.state === 'new';

  return (
    <>
      <PageHeader kicker={t('review.kicker')} title={t('review.title')}>
        <p className="text-muted text-sm" aria-live="polite">
          {tp('review.remaining', remaining)}
        </p>
      </PageHeader>

      {!term ? (
        <Spinner label={t('common.loading')} />
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <Panel key={current.termId + current.reps} className="flip-enter overflow-hidden">
            <div className="border-line flex items-center justify-between border-b px-5 py-2.5">
              <span className={cx('label-tech', isNew && 'text-accent')}>
                {isNew ? t('review.new') : t(`review.state.${current.state}` as const)}
              </span>
              <LevelBadge level={term.level} />
            </div>
            <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <ArticleBadge article={term.de.article} size="lg" />
                <p
                  lang="de"
                  className="text-3xl font-semibold tracking-tight break-all sm:text-4xl"
                >
                  {term.de.word}
                </p>
              </div>
              <SpeakButton text={withArticle(term)} />
            </div>

            {flipped ? (
              <div
                className="border-line-strong flex flex-col gap-3 border-t border-dashed px-5 py-6"
                aria-live="polite"
              >
                <p className="text-center text-2xl font-semibold">{tr?.term}</p>
                {term.de.plural && (
                  <p lang="de" className="text-muted text-center text-sm">
                    {t('term.pluralShort', { plural: term.de.plural })}
                  </p>
                )}
                <p className="text-muted">
                  {prefs.explanation === 'simple' ? tr?.simple : tr?.technical}
                </p>
                {term.examples[0] && (
                  <div className="border-primary border-l-4 pl-3">
                    <p lang="de" className="font-medium">
                      {term.examples[0].de}
                    </p>
                    <p className="text-muted text-sm">{pick(term.examples[0].tr)}</p>
                  </div>
                )}
                <Link
                  to={`/glossary/${term.id}`}
                  className="text-primary self-start text-sm underline-offset-4 hover:underline"
                >
                  {t('review.details')}
                </Link>
              </div>
            ) : null}
          </Panel>

          {!flipped ? (
            <Button
              id="show-answer"
              size="lg"
              variant="primary"
              onClick={() => setFlipped(true)}
              className="w-full"
            >
              {t('review.show')}{' '}
              <kbd className="ml-2 rounded border border-current/40 px-1.5 font-mono text-xs">
                {t('review.spaceKey')}
              </kbd>
            </Button>
          ) : (
            <div
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              role="group"
              aria-label={t('review.rate')}
            >
              {RATINGS.map((r) => {
                const ivl = options ? formatInterval(options[r], Date.now()) : null;
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={busy}
                    onClick={() => void rate(r)}
                    className={cx(
                      'bg-surface flex min-h-16 flex-col items-center justify-center rounded-xl border-2 px-2 py-2 font-semibold transition-colors',
                      RATING_STYLE[r],
                    )}
                  >
                    <span>
                      <kbd className="mr-1.5 font-mono text-xs opacity-80">{r}</kbd>
                      {t(`rating.${r}` as const)}
                    </span>
                    {ivl && (
                      <span className="text-muted text-xs font-normal">
                        {number(ivl.value)} {t(`unit.${ivl.unit}` as const)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-muted text-center text-xs">{t('review.shortcuts')}</p>
        </div>
      )}
    </>
  );
}
