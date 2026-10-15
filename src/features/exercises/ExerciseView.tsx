import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useI18n } from '@/content/locale';
import { ARTICLES } from '@/content/constants';
import type { Article, Term } from '@/content/schema';
import {
  checkTyped,
  checkTypedTranslation,
  isCorrect,
  type Exercise,
  type Verdict,
} from '@/lib/exercises';
import { speak } from '@/lib/speech';
import { useExerciseContext } from './useExerciseContext';
import { Icon } from '@/components/Icon';
import { ArticleBadge } from '@/components/term-bits';
import { withArticle } from '@/lib/term';
import { Button } from '@/components/ui';
import { cx } from '@/lib/cx';

export interface Answer {
  correct: boolean;
  /** mensagem curta de correção */
  note?: string;
}

interface Props {
  exercise: Exercise;
  onAnswer: (a: Answer) => void;
  answered: Answer | null;
}

function Options({
  options,
  render,
  correctId,
  onPick,
  disabled,
  lang,
}: {
  options: Term[];
  render: (t: Term) => string;
  correctId: string;
  onPick: (t: Term) => void;
  disabled: boolean;
  lang?: string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  // atalhos 1–4 para as opções
  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      const i = Number(e.key) - 1;
      const opt = options[i];
      if (opt && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setPicked(opt.id);
        onPick(opt);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options, onPick, disabled]);

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {options.map((opt, i) => {
        const isCorrectOpt = disabled && opt.id === correctId;
        const isWrongPick = disabled && picked === opt.id && opt.id !== correctId;
        return (
          <li key={opt.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setPicked(opt.id);
                onPick(opt);
              }}
              className={cx(
                'bg-surface flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-4 py-2 text-left transition-colors',
                !disabled && 'border-line hover:border-primary',
                isCorrectOpt && 'border-good bg-good-soft',
                isWrongPick && 'border-bad bg-bad-soft',
                disabled && !isCorrectOpt && !isWrongPick && 'border-line opacity-70',
              )}
            >
              <kbd className="text-muted font-mono text-xs">{i + 1}</kbd>
              <span lang={lang} className="flex-1">
                {render(opt)}
              </span>
              {isCorrectOpt && <Icon name="check" className="text-good size-5" />}
              {isWrongPick && <Icon name="x" className="text-bad size-5" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function TypedAnswer({
  expected,
  check,
  onAnswer,
  disabled,
  label,
  lang,
}: {
  /** resposta mostrada na correção */
  expected: string;
  check: (value: string) => Verdict;
  onAnswer: (a: Answer) => void;
  disabled: boolean;
  label: string;
  lang?: string;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const messages: Record<Verdict, string> = {
    exact: '',
    accent: t('exercise.accentNote', { expected }),
    typo: t('exercise.typoNote', { expected }),
    wrong: t('exercise.wrongNote', { expected }),
    'wrong-article': t('exercise.articleNote', { expected }),
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    const v = check(value);
    onAnswer({ correct: isCorrect(v), note: messages[v] || undefined });
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
      <label className="flex-1">
        <span className="sr-only">{label}</span>
        <input
          ref={input}
          lang={lang}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={label}
          className="border-line-strong bg-surface min-h-12 w-full rounded-lg border-2 px-4 text-lg"
        />
      </label>
      <Button type="submit" variant="primary" size="lg" disabled={disabled || !value.trim()}>
        {t('exercise.check')}
      </Button>
    </form>
  );
}

function MatchPairs({
  exercise,
  onAnswer,
  answered,
}: Props & { exercise: Extract<Exercise, { kind: 'match' }> }) {
  const { t, termTr } = useI18n();
  const [left, setLeft] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);

  const pickRight = (id: string) => {
    if (!left || answered) return;
    if (id === left) {
      const next = new Set(done).add(id);
      setDone(next);
      setLeft(null);
      if (next.size === exercise.terms.length) {
        onAnswer({
          correct: mistakes === 0,
          note: mistakes ? t('exercise.matchMistakes', { count: mistakes }) : undefined,
        });
      }
    } else {
      setMistakes((m) => m + 1);
      setFlash(id);
      window.setTimeout(() => setFlash(null), 500);
    }
  };

  const col =
    'flex min-h-12 w-full items-center rounded-lg border-2 px-3 py-2 text-left transition-colors';
  return (
    <div className="grid grid-cols-2 gap-3">
      <ul className="flex flex-col gap-2" aria-label={t('exercise.matchLeft')}>
        {exercise.terms.map((term) => (
          <li key={term.id}>
            <button
              type="button"
              lang="de"
              disabled={done.has(term.id) || !!answered}
              aria-pressed={left === term.id}
              onClick={() => setLeft(term.id)}
              className={cx(
                col,
                done.has(term.id)
                  ? 'border-good bg-good-soft text-good'
                  : left === term.id
                    ? 'border-primary bg-primary-soft'
                    : 'border-line bg-surface hover:border-primary',
              )}
            >
              {withArticle(term)}
            </button>
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-2" aria-label={t('exercise.matchRight')}>
        {exercise.right.map((term) => (
          <li key={term.id}>
            <button
              type="button"
              disabled={done.has(term.id) || !!answered || !left}
              onClick={() => pickRight(term.id)}
              className={cx(
                col,
                done.has(term.id)
                  ? 'border-good bg-good-soft text-good'
                  : flash === term.id
                    ? 'border-bad bg-bad-soft'
                    : 'border-line bg-surface hover:border-primary disabled:hover:border-line',
              )}
            >
              {termTr(term)?.term}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Enunciado + interação de cada tipo de exercício. */
export function ExerciseView({ exercise, onAnswer, answered }: Props) {
  const { t, locale } = useI18n();
  const ctx = useExerciseContext();
  const disabled = !!answered;
  const term = exercise.kind === 'match' ? null : exercise.term;
  /** tradução falada/escrita sem os parênteses explicativos */
  const spoken = term ? (ctx.answers(term)[0] ?? ctx.tr(term)) : '';

  useEffect(() => {
    if (exercise.kind === 'listen') speak(withArticle(exercise.term));
    if (exercise.kind === 'listen-pt') speak(spoken, locale.speechLang);
  }, [exercise, spoken, locale.speechLang]);

  const pickAnswer = (o: Term) => onAnswer({ correct: o.id === term?.id });
  const german = (tm: Term) => (
    <p lang="de" className="flex flex-wrap items-center gap-3 text-3xl font-semibold">
      <ArticleBadge article={tm.de.article} size="lg" />
      <span className="break-all">{tm.de.word}</span>
    </p>
  );

  return (
    <div className="flex flex-col gap-5">
      <p className="label-tech">{t(`exercise.prompt.${exercise.kind}` as const)}</p>

      {exercise.kind === 'mc-de' && (
        <>
          {german(exercise.term)}
          <Options
            options={exercise.options}
            render={ctx.tr}
            correctId={exercise.term.id}
            disabled={disabled}
            onPick={pickAnswer}
          />
        </>
      )}

      {exercise.kind === 'mc-pt' && (
        <>
          <p className="text-3xl font-semibold">{ctx.tr(exercise.term)}</p>
          <Options
            options={exercise.options}
            render={withArticle}
            lang="de"
            correctId={exercise.term.id}
            disabled={disabled}
            onPick={pickAnswer}
          />
        </>
      )}

      {(exercise.kind === 'listen' || exercise.kind === 'listen-pt') && (
        <>
          <Button
            size="lg"
            variant="primary"
            className="self-start"
            onClick={() =>
              exercise.kind === 'listen'
                ? speak(withArticle(exercise.term))
                : speak(spoken, locale.speechLang)
            }
          >
            <Icon name="speaker" /> {t('exercise.listenAgain')}
          </Button>
          {answered && (
            <p
              lang={exercise.kind === 'listen' ? 'de' : undefined}
              className="text-2xl font-semibold"
            >
              {exercise.kind === 'listen' ? withArticle(exercise.term) : ctx.tr(exercise.term)}
            </p>
          )}
          <Options
            options={exercise.options}
            render={exercise.kind === 'listen' ? ctx.tr : withArticle}
            lang={exercise.kind === 'listen' ? undefined : 'de'}
            correctId={exercise.term.id}
            disabled={disabled}
            onPick={pickAnswer}
          />
        </>
      )}

      {exercise.kind === 'explain' && (
        <>
          {german(exercise.term)}
          <Options
            options={exercise.options}
            render={ctx.simple}
            correctId={exercise.term.id}
            disabled={disabled}
            onPick={pickAnswer}
          />
        </>
      )}

      {exercise.kind === 'define' && (
        <>
          <blockquote className="border-primary border-l-4 pl-4 text-lg leading-relaxed">
            {exercise.definition}
          </blockquote>
          {answered && (
            <p lang="de" className="text-muted">
              {withArticle(exercise.term)}
            </p>
          )}
          <Options
            options={exercise.options}
            render={ctx.tr}
            correctId={exercise.term.id}
            disabled={disabled}
            onPick={pickAnswer}
          />
        </>
      )}

      {exercise.kind === 'article' && (
        <ArticleQuestion term={exercise.term} disabled={disabled} onAnswer={onAnswer} />
      )}

      {exercise.kind === 'plural' && (
        <>
          <p className="text-muted">{ctx.tr(exercise.term)}</p>
          <p lang="de" className="flex flex-wrap items-center gap-3 text-2xl font-semibold">
            <ArticleBadge article={exercise.term.de.article} />
            {exercise.term.de.word} → <span className="font-mono">die …</span>
          </p>
          <TypedAnswer
            expected={exercise.term.de.plural ?? ''}
            check={(v) => {
              const verdict = checkTyped(v, exercise.term.de.plural ?? '');
              // no plural, o trema é justamente o que se treina (Mutter → Mütter)
              return verdict === 'accent' &&
                v.trim().toLowerCase() !== (exercise.term.de.plural ?? '').toLowerCase()
                ? 'typo'
                : verdict;
            }}
            lang="de"
            disabled={disabled}
            label={t('exercise.typePlural')}
            onAnswer={onAnswer}
          />
        </>
      )}

      {exercise.kind === 'typing' && (
        <>
          <p className="text-3xl font-semibold">{ctx.tr(exercise.term)}</p>
          {exercise.term.de.article && (
            <p className="text-muted text-sm">{t('exercise.typingHint')}</p>
          )}
          <TypedAnswer
            expected={withArticle(exercise.term)}
            check={(v) => checkTyped(v, exercise.term.de.word, exercise.term.de.article)}
            lang="de"
            disabled={disabled}
            label={t('exercise.typeGerman')}
            onAnswer={onAnswer}
          />
        </>
      )}

      {exercise.kind === 'typing-pt' && (
        <>
          {german(exercise.term)}
          <p className="text-muted text-sm">{t('exercise.typingPtHint')}</p>
          <TypedAnswer
            expected={ctx.tr(exercise.term)}
            check={(v) => checkTypedTranslation(v, ctx.answers(exercise.term))}
            disabled={disabled}
            label={t('exercise.typeTranslation')}
            onAnswer={onAnswer}
          />
        </>
      )}

      {(exercise.kind === 'cloze' || exercise.kind === 'cloze-pt') && (
        <>
          <p
            lang={exercise.kind === 'cloze' ? 'de' : undefined}
            className="text-2xl leading-relaxed font-medium"
          >
            {exercise.before}
            <span className="border-primary text-primary mx-1 inline-block min-w-24 border-b-2 text-center">
              {answered ? exercise.gap : '\u2003?\u2003'}
            </span>
            {exercise.after}
          </p>
          <p lang={exercise.kind === 'cloze-pt' ? 'de' : undefined} className="text-muted">
            {exercise.translation}
          </p>
          <Options
            options={exercise.options}
            render={exercise.kind === 'cloze' ? (o) => o.de.word : ctx.tr}
            lang={exercise.kind === 'cloze' ? 'de' : undefined}
            correctId={exercise.term.id}
            disabled={disabled}
            onPick={pickAnswer}
          />
        </>
      )}

      {exercise.kind === 'match' && (
        <MatchPairs exercise={exercise} onAnswer={onAnswer} answered={answered} />
      )}
    </div>
  );
}

function ArticleQuestion({
  term,
  disabled,
  onAnswer,
}: {
  term: Term;
  disabled: boolean;
  onAnswer: (a: Answer) => void;
}) {
  const { t, termTr } = useI18n();
  const [picked, setPicked] = useState<Article | null>(null);
  const choose = useCallback(
    (a: Article) => {
      setPicked(a);
      const ok = a === term.de.article;
      onAnswer({
        correct: ok,
        note: ok ? undefined : t('exercise.articleIs', { word: withArticle(term) }),
      });
    },
    [term, onAnswer, t],
  );
  return (
    <>
      <p className="text-muted">{termTr(term)?.term}</p>
      <p lang="de" className="text-3xl font-semibold">
        ___ {term.de.word}
      </p>
      <div className="grid grid-cols-3 gap-3" role="group" aria-label={t('term.article')}>
        {ARTICLES.map((a, i) => {
          const right = disabled && a === term.de.article;
          const wrong = disabled && a === picked && !right;
          return (
            <button
              key={a}
              type="button"
              disabled={disabled}
              onClick={() => choose(a)}
              className={cx(
                'bg-surface flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2',
                right
                  ? 'border-good bg-good-soft'
                  : wrong
                    ? 'border-bad bg-bad-soft'
                    : 'border-line hover:border-primary',
              )}
            >
              <ArticleBadge article={a} size="lg" />
              <span className="sr-only">{a}</span>
              <kbd className="text-muted font-mono text-xs" aria-hidden="true">
                {i + 1}
              </kbd>
            </button>
          );
        })}
      </div>
      <ArticleKeys disabled={disabled} onPick={choose} />
    </>
  );
}

/** atalhos 1–3 para der/die/das */
function ArticleKeys({
  disabled,
  onPick,
}: {
  disabled: boolean;
  onPick: (a: (typeof ARTICLES)[number]) => void;
}) {
  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      const a = ARTICLES[Number(e.key) - 1];
      if (a && !(e.target as HTMLElement).closest('input')) {
        e.preventDefault();
        onPick(a);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [disabled, onPick]);
  return null;
}
