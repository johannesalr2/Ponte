import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n } from '@/content/locale';
import { Button, PageHeader, Panel, Spinner } from '@/components/ui';
import { seeded } from '@/lib/exercises';
import { cx } from '@/lib/cx';
import { esco, toId, toUri } from './esco/config';
import type { Occupation } from './esco/types';
import { AsyncView, LangText, SpeakButton } from './bits';
import type { LangPair } from './prefs';
import { buildQuiz, type QuizItem, type QuizQuestion } from './quiz';
import { useAsync } from './useAsync';
import { useSkills } from './useSkills';

const SIZE = 10;

export default function PracticePage({ pair }: { pair: LangPair }) {
  const { id = '' } = useParams();
  const uri = toUri('occupation', id);
  const state = useAsync(`${uri}|${pair.learn}`, () => esco.occupation(uri, pair.learn));
  return <AsyncView state={state}>{(occ) => <Loader occ={occ} pair={pair} />}</AsyncView>;
}

/** Junta os rótulos das habilidades nos dois idiomas e monta o exercício. */
function Loader({ occ, pair }: { occ: Occupation; pair: LangPair }) {
  const { t } = useI18n();
  // essenciais primeiro; 24 bastam para 10 perguntas com boas alternativas
  const uris = useMemo(
    () => [...occ.essential, ...occ.optional].slice(0, 24).map((r) => r.uri),
    [occ],
  );
  const { skills, done, total } = useSkills(uris, pair.learn, 6);
  const [seed, setSeed] = useState(() => Date.now());

  const quiz = useMemo(() => {
    if (done < total) return null;
    const items: QuizItem[] = [...skills.values()].flatMap((s) => {
      const learn = s.labels[pair.learn];
      const know = s.labels[pair.know];
      return learn && know ? [{ uri: s.uri, learn, know }] : [];
    });
    return buildQuiz(items, seeded(seed), SIZE);
  }, [done, total, skills, pair, seed]);

  const title = occ.labels[pair.learn] ?? '';
  return (
    <>
      <PageHeader title={t('esco.practice.title')} kicker={title.replace(/\//g, '/\u200B')} />
      {!quiz ? (
        <Spinner label={t('esco.practice.loading', { done, total })} />
      ) : quiz.length === 0 ? (
        <Panel className="p-5">
          <p>{t('esco.practice.notEnough')}</p>
          <BackLink occ={occ} />
        </Panel>
      ) : (
        <Quiz key={seed} quiz={quiz} pair={pair} occ={occ} onAgain={() => setSeed(Date.now())} />
      )}
    </>
  );
}

function BackLink({ occ }: { occ: Occupation }) {
  const { t } = useI18n();
  return (
    <Link
      to={`/second/o/${toId(occ.uri)}`}
      className="text-primary mt-4 inline-block underline underline-offset-2"
    >
      {t('esco.practice.back')}
    </Link>
  );
}

function Quiz({
  quiz,
  pair,
  occ,
  onAgain,
}: {
  quiz: QuizQuestion[];
  pair: LangPair;
  occ: Occupation;
  onAgain: () => void;
}) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [wrong, setWrong] = useState<QuizQuestion[]>([]);
  const nextRef = useRef<HTMLButtonElement>(null);
  // depois de responder, o foco vai para "Próxima" (Enter avança)
  useEffect(() => {
    if (chosen !== null) nextRef.current?.focus();
  }, [chosen]);

  if (index >= quiz.length) {
    return (
      <Panel className="p-5">
        <p className="text-xl font-semibold" role="status">
          {t('esco.practice.result', { right: quiz.length - wrong.length, total: quiz.length })}
        </p>
        {wrong.length > 0 && (
          <>
            <h2 className="label-tech mt-5 mb-2">{t('esco.practice.mistakes')}</h2>
            <ul className="divide-line divide-y">
              {wrong.map((q) => (
                <li key={q.item.uri} className="py-2">
                  <Link to={`/second/s/${toId(q.item.uri)}`} className="hover:underline">
                    <LangText lang={pair.learn} text={q.item.learn} className="font-medium" />
                  </Link>
                  <span className="text-muted block text-sm">
                    <LangText lang={pair.know} text={q.item.know} />
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button variant="primary" onClick={onAgain}>
            {t('esco.practice.again')}
          </Button>
          <BackLink occ={occ} />
        </div>
      </Panel>
    );
  }

  const q = quiz[index];
  if (!q) return null;
  const promptLang = q.fromLearn ? pair.learn : pair.know;
  const answerLang = q.fromLearn ? pair.know : pair.learn;
  const answered = chosen !== null;
  const right = chosen === q.answer;
  const choose = (opt: string) => {
    if (answered) return;
    setChosen(opt);
    if (opt !== q.answer) setWrong((w) => [...w, q]);
  };
  const next = () => {
    setChosen(null);
    setIndex((i) => i + 1);
  };

  return (
    <Panel className="p-5">
      <p className="text-muted text-sm">
        {t('esco.practice.progress', { n: index + 1, total: quiz.length })}
      </p>
      <p className="label-tech mt-3">{t('esco.practice.question')}</p>
      <p className="mt-1 flex items-start gap-1 text-xl font-semibold">
        <LangText lang={promptLang} text={q.prompt} />
        {q.fromLearn && <SpeakButton text={q.prompt} lang={pair.learn} />}
      </p>
      <ul className="mt-4 grid gap-2">
        {q.options.map((opt, i) => {
          const isAnswer = opt === q.answer;
          return (
            <li key={opt}>
              <button
                type="button"
                onClick={() => choose(opt)}
                disabled={answered}
                className={cx(
                  'flex min-h-12 w-full items-center gap-3 rounded-lg border px-4 py-2 text-start',
                  !answered && 'border-line-strong bg-surface hover:bg-surface-2',
                  answered && isAnswer && 'border-good bg-good-soft',
                  answered && opt === chosen && !isAnswer && 'border-bad bg-bad-soft',
                  answered && opt !== chosen && !isAnswer && 'border-line opacity-60',
                )}
              >
                <span className="text-muted font-mono text-sm">{i + 1}</span>
                <LangText lang={answerLang} text={opt} />
              </button>
            </li>
          );
        })}
      </ul>
      {answered && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3" aria-live="polite">
          <p className={right ? 'text-good font-semibold' : 'text-bad'}>
            {right ? t('esco.practice.correct') : t('esco.practice.wrong', { answer: q.answer })}
          </p>
          <Button ref={nextRef} variant="primary" onClick={next}>
            {index + 1 < quiz.length ? t('esco.practice.next') : t('esco.practice.finish')}
          </Button>
        </div>
      )}
    </Panel>
  );
}
