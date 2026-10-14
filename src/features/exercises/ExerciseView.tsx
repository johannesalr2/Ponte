import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useI18n } from '@/content/locale';
import { ARTICLES } from '@/content/constants';
import type { Article, Term } from '@/content/schema';
import { checkTyped, isCorrect, type Exercise, type Verdict } from '@/lib/exercises';
import { speak } from '@/lib/speech';
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
  article,
  onAnswer,
  disabled,
  label,
}: {
  expected: string;
  article: Term['de']['article'];
  onAnswer: (a: Answer) => void;
  disabled: boolean;
  label: string;
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
    'wrong-article': t('exercise.articleNote', { expected: `${article ?? ''} ${expected}` }),
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    const v = checkTyped(value, expected, article);
    onAnswer({ correct: isCorrect(v), note: messages[v] || undefined });
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
      <label className="flex-1">
        <span className="sr-only">{label}</span>
        <input
          ref={input}
          lang="de"
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
  const { t, termTr } = useI18n();
  const tr = (term: Term) => termTr(term)?.term ?? term.de.word;
  const disabled = !!answered;

  const prompt = useMemo(() => {
    switch (exercise.kind) {
      case 'mc-de':
        return t('exercise.prompt.mc-de');
      case 'mc-pt':
        return t('exercise.prompt.mc-pt');
      case 'article':
        return t('exercise.prompt.article');
      case 'plural':
        return t('exercise.prompt.plural');
      case 'cloze':
        return t('exercise.prompt.cloze');
      case 'typing':
        return t('exercise.prompt.typing');
      case 'match':
        return t('exercise.prompt.match');
      case 'listen':
        return t('exercise.prompt.listen');
    }
  }, [exercise.kind, t]);

  useEffect(() => {
    if (exercise.kind === 'listen') speak(withArticle(exercise.term));
  }, [exercise]);

  return (
    <div className="flex flex-col gap-5">
      <p className="label-tech">{prompt}</p>

      {exercise.kind === 'mc-de' && (
        <>
          <p lang="de" className="flex flex-wrap items-center gap-3 text-3xl font-semibold">
            <ArticleBadge article={exercise.term.de.article} size="lg" />
            {exercise.term.de.word}
          </p>
          <Options
            options={exercise.options}
            render={tr}
            correctId={exercise.term.id}
            disabled={disabled}
            onPick={(o) => onAnswer({ correct: o.id === exercise.term.id })}
          />
        </>
      )}

      {exercise.kind === 'mc-pt' && (
        <>
          <p className="text-3xl font-semibold">{tr(exercise.term)}</p>
          <Options
            options={exercise.options}
            render={withArticle}
            lang="de"
            correctId={exercise.term.id}
            disabled={disabled}
            onPick={(o) => onAnswer({ correct: o.id === exercise.term.id })}
          />
        </>
      )}

      {exercise.kind === 'listen' && (
        <>
          <Button
            size="lg"
            variant="primary"
            className="self-start"
            onClick={() => speak(withArticle(exercise.term))}
          >
            <Icon name="speaker" /> {t('exercise.listenAgain')}
          </Button>
          {answered && (
            <p lang="de" className="text-2xl font-semibold">
              {withArticle(exercise.term)}
            </p>
          )}
          <Options
            options={exercise.options}
            render={tr}
            correctId={exercise.term.id}
            disabled={disabled}
            onPick={(o) => onAnswer({ correct: o.id === exercise.term.id })}
          />
        </>
      )}

      {exercise.kind === 'article' && (
        <ArticleQuestion term={exercise.term} disabled={disabled} onAnswer={onAnswer} />
      )}

      {exercise.kind === 'plural' && (
        <>
          <p className="text-muted">{tr(exercise.term)}</p>
          <p lang="de" className="flex flex-wrap items-center gap-3 text-2xl font-semibold">
            <ArticleBadge article={exercise.term.de.article} />
            {exercise.term.de.word} → <span className="font-mono">die …</span>
          </p>
          <TypedAnswer
            expected={exercise.term.de.plural ?? ''}
            article={null}
            disabled={disabled}
            label={t('exercise.typePlural')}
            onAnswer={onAnswer}
          />
        </>
      )}

      {exercise.kind === 'typing' && (
        <>
          <p className="text-3xl font-semibold">{tr(exercise.term)}</p>
          {exercise.term.de.article && (
            <p className="text-muted text-sm">{t('exercise.typingHint')}</p>
          )}
          <TypedAnswer
            expected={exercise.term.de.word}
            article={exercise.term.de.article}
            disabled={disabled}
            label={t('exercise.typeGerman')}
            onAnswer={onAnswer}
          />
        </>
      )}

      {exercise.kind === 'cloze' && (
        <>
          <p lang="de" className="text-2xl leading-relaxed font-medium">
            {exercise.before}
            <span className="border-primary text-primary mx-1 inline-block min-w-24 border-b-2 text-center">
              {answered ? exercise.gap : ' ? '}
            </span>
            {exercise.after}
          </p>
          <p className="text-muted">{exercise.translation}</p>
          <Options
            options={exercise.options}
            render={(o) => o.de.word}
            lang="de"
            correctId={exercise.term.id}
            disabled={disabled}
            onPick={(o) => onAnswer({ correct: o.id === exercise.term.id })}
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
