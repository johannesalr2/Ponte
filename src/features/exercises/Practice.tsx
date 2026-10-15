import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveProfile } from '@/app/profile';
import { useI18n, type UiKey } from '@/content/locale';
import { useProfessionContent } from '@/content/loader';
import type { Term } from '@/content/schema';
import {
  recordPractice,
  savePracticeStat,
  useCards,
  usePracticeStats,
  usePrefs,
  useRecentPractice,
} from '@/db/hooks';
import {
  buildSession,
  eligibleFor,
  exerciseTerms,
  kindsOfFocus,
  MODES,
  seeded,
  type Exercise,
  type ExerciseKind,
  type PracticeMode,
} from '@/lib/exercises';
import { pickPracticeTerms, recommendMode } from '@/lib/practice';
import { withArticle } from '@/lib/term';
import { cx } from '@/lib/cx';
import { FocusToggle } from '@/components/FocusToggle';
import { Icon, type IconName } from '@/components/Icon';
import { Button, Chip, PageHeader, Panel, Spinner } from '@/components/ui';
import { ExerciseView, type Answer } from './ExerciseView';
import { useExerciseContext } from './useExerciseContext';

const SIZE = 10;
const MODE_ICON: Record<PracticeMode, IconName> = {
  understand: 'speaker',
  recall: 'practice',
  grammar: 'layers',
  explain: 'chat',
};

type Source = 'auto' | 'studying' | 'profession' | `area:${string}`;

interface Running {
  exercises: Exercise[];
  kinds: readonly ExerciseKind[];
  /** modo usado (para guardar o resultado); null em treino personalizado */
  mode: PracticeMode | null;
}

export default function Practice() {
  const profile = useActiveProfile();
  const prefs = usePrefs();
  const focus = prefs.focus;
  const { t, tp, pick, number } = useI18n();
  const ctx = useExerciseContext();
  const content = useProfessionContent(profile.profession);
  const cards = useCards();
  const recent = useRecentPractice();
  const stats = usePracticeStats();

  const modes = MODES[focus];
  const customKinds = useMemo(
    () => kindsOfFocus(focus).filter((k) => ctx.speech || !k.startsWith('listen')),
    [focus, ctx.speech],
  );
  const [source, setSource] = useState<Source>('auto');
  const [kinds, setKinds] = useState<Set<ExerciseKind>>(new Set(customKinds));
  useEffect(() => setKinds(new Set(customKinds)), [customKinds]);

  const [run, setRun] = useState<Running | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState<Term[]>([]);
  const nextBtn = useRef<HTMLButtonElement>(null);

  const pool = useMemo(() => content?.terms ?? [], [content]);
  const studying = useMemo(() => new Set(cards?.map((c) => c.termId)), [cards]);

  const begin = (exercises: Exercise[], k: readonly ExerciseKind[], mode: PracticeMode | null) => {
    setRun({ exercises, kinds: k, mode });
    setIndex(0);
    setAnswer(null);
    setScore(0);
    setMistakes([]);
  };

  /** Treino automático: o app escolhe os termos (erros recentes, fracos, novos). */
  const startMode = (mode: PracticeMode, onlyTerms?: Term[]) => {
    const k = (modes.find((m) => m.mode === mode)?.kinds ?? []).filter(
      (x) => ctx.speech || !x.startsWith('listen'),
    );
    const terms =
      onlyTerms ??
      pickPracticeTerms({
        terms: pool,
        cards: cards ?? [],
        results: recent ?? [],
        level: profile.level,
        eligible: eligibleFor(k, ctx),
        size: SIZE,
        now: Date.now(),
        rng: seeded(Date.now()),
      });
    begin(
      buildSession(terms, pool, ctx, { size: SIZE, kinds: k, rng: seeded(Date.now()) }),
      k,
      mode,
    );
  };

  const sourceTerms = useMemo(() => {
    if (source === 'studying') return pool.filter((tm) => studying.has(tm.id));
    if (source === 'profession') return pool;
    if (source.startsWith('area:')) return pool.filter((tm) => tm.area === source.slice(5));
    return null; // automático
  }, [pool, source, studying]);

  const startCustom = (onlyTerms?: Term[]) => {
    const k = [...kinds];
    const terms =
      onlyTerms ??
      sourceTerms ??
      pickPracticeTerms({
        terms: pool,
        cards: cards ?? [],
        results: recent ?? [],
        level: profile.level,
        eligible: eligibleFor(k, ctx),
        size: SIZE,
        now: Date.now(),
        rng: seeded(Date.now()),
      });
    begin(
      buildSession(terms, pool, ctx, { size: SIZE, kinds: k, rng: seeded(Date.now()) }),
      k,
      null,
    );
  };

  const onAnswer = useCallback(
    (a: Answer) => {
      const ex = run?.exercises[index];
      if (answer || !ex) return;
      setAnswer(a);
      if (a.correct) setScore((s) => s + 1);
      else if (ex.kind !== 'match') setMistakes((m) => [...m, ex.term]);
      void recordPractice(
        exerciseTerms(ex).map((tm) => tm.id),
        ex.kind,
        a.correct,
      );
    },
    [answer, run, index],
  );

  // leva o foco ao botão "Continuar" depois de responder (teclado e leitor de tela)
  useEffect(() => {
    if (answer) nextBtn.current?.focus();
  }, [answer]);

  const next = useCallback(() => {
    setAnswer(null);
    setIndex((i) => i + 1);
  }, []);

  // ao terminar um treino de modo, guarda o resultado para a recomendação
  const finished = run && index >= run.exercises.length;
  useEffect(() => {
    if (finished && run.mode && run.exercises.length) {
      void savePracticeStat(`${focus}:${run.mode}`, {
        correct: score,
        total: run.exercises.length,
        at: Date.now(),
      });
    }
    // grava uma vez por treino concluído
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  // Enter ou espaço avançam depois da resposta
  useEffect(() => {
    if (!answer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target as HTMLElement;
        if (target.closest('button, a') && target.id !== 'next-exercise') return;
        e.preventDefault();
        next();
      }
    };
    const id = window.setTimeout(() => window.addEventListener('keydown', onKey), 50);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', onKey);
    };
  }, [answer, next]);

  if (!content || !cards || !recent || !stats) return <Spinner label={t('common.loading')} />;

  // ------------------------------------------------------------ escolha do modo
  if (!run) {
    const statOf = (mode: PracticeMode) => stats[`${focus}:${mode}`];
    const recommended = recommendMode(
      modes.map((m) => m.mode),
      Object.fromEntries(modes.map((m) => [m.mode, statOf(m.mode)])),
    );
    return (
      <>
        <PageHeader kicker={t('practice.kicker')} title={t('practice.title')}>
          <FocusToggle />
        </PageHeader>
        <p className="text-muted mb-5 max-w-2xl">{t(`practice.focusHint.${focus}` as const)}</p>

        <ul className="grid gap-3 md:grid-cols-3">
          {modes.map(({ mode }) => {
            const stat = statOf(mode);
            const isRec = mode === recommended;
            return (
              <li key={mode}>
                <button
                  type="button"
                  onClick={() => startMode(mode)}
                  className={cx(
                    'bg-surface flex h-full w-full flex-col gap-2 rounded-xl border-2 p-5 text-left transition-colors',
                    isRec ? 'border-primary' : 'border-line hover:border-primary',
                  )}
                >
                  {isRec && (
                    <span className="bg-primary text-primary-ink self-start rounded-full px-2.5 py-0.5 text-xs font-semibold">
                      ★ {t('practice.recommended')}
                    </span>
                  )}
                  <span className="flex items-center gap-2 text-xl font-semibold">
                    <Icon name={MODE_ICON[mode]} className="text-primary size-6" />
                    {t(`practice.mode.${mode}` as const)}
                  </span>
                  <span>{t(`practice.mode.${focus}.${mode}` as UiKey)}</span>
                  <span className="text-muted text-sm">
                    {t(`practice.mode.${mode}.time` as const)}
                  </span>
                  <span className="text-muted mt-auto pt-2 text-sm">
                    {stat?.total
                      ? t('practice.last', {
                          correct: number(stat.correct),
                          total: number(stat.total),
                        })
                      : t('practice.never')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <details className="group mt-8">
          <summary className="text-primary inline-flex min-h-11 cursor-pointer items-center gap-1 font-medium">
            {t('practice.customize')}
            <Icon name="chevron" className="size-4 transition-transform group-open:rotate-90" />
          </summary>
          <Panel className="mt-3 flex flex-col gap-6 p-5">
            <fieldset>
              <legend className="mb-2 font-semibold">{t('practice.source')}</legend>
              <div className="flex flex-wrap gap-2">
                <Chip active={source === 'auto'} onClick={() => setSource('auto')}>
                  {t('practice.source.auto')}
                </Chip>
                <Chip active={source === 'studying'} onClick={() => setSource('studying')}>
                  {t('practice.source.studying')} ({number(studying.size)})
                </Chip>
                <Chip active={source === 'profession'} onClick={() => setSource('profession')}>
                  {t('practice.source.profession')}
                </Chip>
                {content.profession.areas.map((a) => (
                  <Chip
                    key={a.id}
                    active={source === `area:${a.id}`}
                    onClick={() => setSource(`area:${a.id}`)}
                  >
                    {pick(a.tr)}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 font-semibold">{t('practice.kinds')}</legend>
              <div className="flex flex-wrap gap-2">
                {customKinds.map((k) => (
                  <Chip
                    key={k}
                    active={kinds.has(k)}
                    onClick={() => {
                      const nextKinds = new Set(kinds);
                      if (nextKinds.has(k)) nextKinds.delete(k);
                      else nextKinds.add(k);
                      if (nextKinds.size) setKinds(nextKinds);
                    }}
                  >
                    {t(`practice.kind.${k}` as const)}
                  </Chip>
                ))}
              </div>
              {!ctx.speech && <p className="text-muted mt-2 text-sm">{t('practice.noSpeech')}</p>}
            </fieldset>
            {sourceTerms && sourceTerms.length < 4 ? (
              <p className="bg-surface-2 rounded-lg p-3 text-sm">{t('practice.needTerms')}</p>
            ) : (
              <Button variant="primary" onClick={() => startCustom()} className="self-start">
                <Icon name="practice" /> {t('practice.start')}
              </Button>
            )}
          </Panel>
        </details>
      </>
    );
  }

  // ------------------------------------------------------------ resultado
  const current = run.exercises[index];
  if (!current) {
    const total = run.exercises.length;
    const pct = total ? Math.round((score / total) * 100) : 0;
    const unique = [...new Map(mistakes.map((m) => [m.id, m])).values()];
    return (
      <>
        <PageHeader kicker={t('practice.kicker')} title={t('practice.result')} />
        <Panel className="flex flex-col gap-4 p-6">
          <p className="text-4xl font-semibold">
            {number(score)}/{number(total)}{' '}
            <span className="text-muted text-lg font-normal">({pct}%)</span>
          </p>
          {total === 0 && <p className="text-muted">{t('practice.empty')}</p>}
          {unique.length > 0 && (
            <div>
              <h2 className="mb-2 font-semibold">{t('practice.reviewThese')}</h2>
              <ul className="flex flex-wrap gap-2">
                {unique.map((m) => (
                  <li key={m.id}>
                    <Link
                      to={`/glossary/${m.id}`}
                      className="border-line-strong hover:border-primary inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm"
                    >
                      <span lang="de">{withArticle(m)}</span>
                      <span className="text-muted">· {ctx.tr(m)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-muted mt-2 text-sm">{t('practice.mistakesScheduled')}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {unique.length > 0 && (
              <Button
                variant="primary"
                onClick={() => (run.mode ? startMode(run.mode, unique) : startCustom(unique))}
              >
                {t('practice.retryMistakes')}
              </Button>
            )}
            <Button
              variant={unique.length ? 'secondary' : 'primary'}
              onClick={() => (run.mode ? startMode(run.mode) : startCustom())}
            >
              {t('practice.again')}
            </Button>
            <Button variant="ghost" onClick={() => setRun(null)}>
              {t('practice.change')}
            </Button>
          </div>
        </Panel>
      </>
    );
  }

  // ------------------------------------------------------------ exercício
  return (
    <>
      <PageHeader
        kicker={run.mode ? t(`practice.mode.${run.mode}` as const) : t('practice.customize')}
        title={t(`practice.kind.${current.kind}` as const)}
      >
        <Button size="sm" variant="ghost" onClick={() => setRun(null)}>
          {t('practice.quit')}
        </Button>
      </PageHeader>
      <div
        className="bg-surface-2 mb-4 h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={run.exercises.length}
        aria-valuenow={index}
        aria-label={tp('practice.progress', run.exercises.length, { current: index + 1 })}
      >
        <div
          className="bg-primary h-full transition-[width]"
          style={{ width: `${(index / run.exercises.length) * 100}%` }}
        />
      </div>
      <Panel className="mx-auto max-w-2xl p-5 sm:p-6">
        <ExerciseView key={index} exercise={current} onAnswer={onAnswer} answered={answer} />
        {answer && (
          <div
            role="status"
            className={cx(
              'mt-5 flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center',
              answer.correct ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad',
            )}
          >
            <p className="flex flex-1 items-start gap-2 font-medium">
              <Icon name={answer.correct ? 'check' : 'x'} className="mt-0.5 size-5 shrink-0" />
              <span>
                {answer.correct ? t('exercise.correct') : t('exercise.incorrect')}
                {answer.note && <span className="text-ink block font-normal">{answer.note}</span>}
              </span>
            </p>
            <Button id="next-exercise" ref={nextBtn} variant="primary" onClick={next}>
              {index === run.exercises.length - 1 ? t('practice.finish') : t('common.next')}
            </Button>
          </div>
        )}
      </Panel>
    </>
  );
}
