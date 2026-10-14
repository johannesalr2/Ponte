import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveProfile } from '@/app/profile';
import { useI18n } from '@/content/locale';
import { useProfessionContent } from '@/content/loader';
import type { Term } from '@/content/schema';
import { recordExercise, useCards } from '@/db/hooks';
import {
  buildSession,
  EXERCISE_KINDS,
  seeded,
  type Exercise,
  type ExerciseKind,
} from '@/lib/exercises';
import { speechSupported } from '@/lib/speech';
import { Icon } from '@/components/Icon';
import {} from '@/components/term-bits';
import { withArticle } from '@/lib/term';
import { Button, Chip, PageHeader, Panel, Spinner } from '@/components/ui';
import { cx } from '@/lib/cx';
import { ExerciseView, type Answer } from './ExerciseView';

type Source = 'studying' | 'profession' | string; // string = id da área

export default function Practice() {
  const profile = useActiveProfile();
  const { t, tp, pick, termTr, number } = useI18n();
  const content = useProfessionContent(profile.profession);
  const cards = useCards();
  const speech = speechSupported();
  const availableKinds = EXERCISE_KINDS.filter((k) => k !== 'listen' || speech);

  const [source, setSource] = useState<Source>('studying');
  const [kinds, setKinds] = useState<Set<ExerciseKind>>(new Set(availableKinds));
  const [session, setSession] = useState<Exercise[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState<Term[]>([]);

  const studying = useMemo(() => new Set(cards?.map((c) => c.termId)), [cards]);
  const pool = useMemo(() => content?.terms ?? [], [content]);
  const sourceTerms = useMemo(() => {
    if (source === 'studying') return pool.filter((tm) => studying.has(tm.id));
    if (source === 'profession') return pool;
    return pool.filter((tm) => tm.area === source);
  }, [pool, source, studying]);

  const start = () => {
    const tr = (tm: Term) => termTr(tm)?.term ?? tm.de.word;
    const trEx = (tm: Term, i: number) => pick(tm.examples[i]?.tr) ?? '';
    const s = buildSession(sourceTerms, pool, tr, trEx, {
      size: 10,
      speech,
      kinds: [...kinds],
      rng: seeded(Date.now()),
    });
    setSession(s);
    setIndex(0);
    setAnswer(null);
    setScore(0);
    setMistakes([]);
  };

  const onAnswer = useCallback(
    (a: Answer) => {
      if (answer || !session) return;
      setAnswer(a);
      if (a.correct) setScore((s) => s + 1);
      else {
        const ex = session[index];
        if (ex && ex.kind !== 'match') setMistakes((m) => [...m, ex.term]);
      }
      void recordExercise(a.correct);
    },
    [answer, session, index],
  );

  const nextBtn = useRef<HTMLButtonElement>(null);
  // leva o foco ao botão "Continuar" depois de responder (teclado e leitor de tela)
  useEffect(() => {
    if (answer) nextBtn.current?.focus();
  }, [answer]);

  const next = useCallback(() => {
    setAnswer(null);
    setIndex((i) => i + 1);
  }, []);

  // Enter ou espaço avançam depois da resposta
  useEffect(() => {
    if (!answer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (
          (e.target as HTMLElement).closest('button, a') &&
          (e.target as HTMLElement).id !== 'next-exercise'
        )
          return;
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

  if (!content || !cards) return <Spinner label={t('common.loading')} />;

  // ------------------------------------------------------------ configuração
  if (!session) {
    return (
      <>
        <PageHeader kicker={t('practice.kicker')} title={t('practice.title')} />
        <Panel className="flex flex-col gap-6 p-5">
          <fieldset>
            <legend className="mb-2 font-semibold">{t('practice.source')}</legend>
            <div className="flex flex-wrap gap-2">
              <Chip active={source === 'studying'} onClick={() => setSource('studying')}>
                {t('practice.source.studying')} ({number(studying.size)})
              </Chip>
              <Chip active={source === 'profession'} onClick={() => setSource('profession')}>
                {t('practice.source.profession')}
              </Chip>
              {content.profession.areas.map((a) => (
                <Chip key={a.id} active={source === a.id} onClick={() => setSource(a.id)}>
                  {pick(a.tr)}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-semibold">{t('practice.kinds')}</legend>
            <div className="flex flex-wrap gap-2">
              {availableKinds.map((k) => (
                <Chip
                  key={k}
                  active={kinds.has(k)}
                  onClick={() => {
                    const next = new Set(kinds);
                    if (next.has(k)) next.delete(k);
                    else next.add(k);
                    if (next.size) setKinds(next);
                  }}
                >
                  {t(`practice.kind.${k}` as const)}
                </Chip>
              ))}
            </div>
            {!speech && <p className="text-muted mt-2 text-sm">{t('practice.noSpeech')}</p>}
          </fieldset>
          {sourceTerms.length < 4 ? (
            <p className="bg-surface-2 rounded-lg p-3 text-sm">
              {t('practice.needTerms')}{' '}
              <button
                type="button"
                className="text-primary font-medium underline"
                onClick={() => setSource('profession')}
              >
                {t('practice.useProfession')}
              </button>
            </p>
          ) : (
            <Button variant="primary" size="lg" onClick={start} className="self-start">
              <Icon name="practice" /> {t('practice.start')}
            </Button>
          )}
        </Panel>
      </>
    );
  }

  // ------------------------------------------------------------ resultado
  const current = session[index];
  if (!current) {
    const pct = session.length ? Math.round((score / session.length) * 100) : 0;
    return (
      <>
        <PageHeader kicker={t('practice.kicker')} title={t('practice.result')} />
        <Panel className="flex flex-col gap-4 p-6">
          <p className="text-4xl font-semibold">
            {number(score)}/{number(session.length)}{' '}
            <span className="text-muted text-lg font-normal">({pct}%)</span>
          </p>
          {mistakes.length > 0 && (
            <div>
              <h2 className="mb-2 font-semibold">{t('practice.reviewThese')}</h2>
              <ul className="flex flex-wrap gap-2">
                {mistakes.map((m, i) => (
                  <li key={m.id + i}>
                    <Link
                      to={`/glossary/${m.id}`}
                      lang="de"
                      className="border-line-strong hover:border-primary inline-flex min-h-9 items-center rounded-full border px-3 text-sm"
                    >
                      {withArticle(m)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={start}>
              {t('practice.again')}
            </Button>
            <Button onClick={() => setSession(null)}>{t('practice.change')}</Button>
          </div>
        </Panel>
      </>
    );
  }

  // ------------------------------------------------------------ exercício
  return (
    <>
      <PageHeader kicker={t('practice.kicker')} title={t(`practice.kind.${current.kind}` as const)}>
        <Button size="sm" variant="ghost" onClick={() => setSession(null)}>
          {t('practice.quit')}
        </Button>
      </PageHeader>
      <div
        className="bg-surface-2 mb-4 h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={session.length}
        aria-valuenow={index}
        aria-label={tp('practice.progress', session.length, { current: index + 1 })}
      >
        <div
          className="bg-primary h-full transition-[width]"
          style={{ width: `${(index / session.length) * 100}%` }}
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
              {index === session.length - 1 ? t('practice.finish') : t('common.next')}
            </Button>
          </div>
        )}
      </Panel>
    </>
  );
}
