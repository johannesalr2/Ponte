import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useActiveProfile } from '@/app/profile';
import { useI18n } from '@/content/locale';
import { useProfessionContent } from '@/content/loader';
import type { Term } from '@/content/schema';
import { addCard, useCard } from '@/db/hooks';
import { parseMarkup, stripMarkup } from '@/lib/markup';
import { speak, speechSupported } from '@/lib/speech';
import { Icon } from '@/components/Icon';
import { ArticleBadge, LevelBadge, SpeakButton } from '@/components/term-bits';
import { withArticle } from '@/lib/term';
import { Button, Panel, Spinner } from '@/components/ui';
import { cx } from '@/lib/cx';

function TermDialog({ term, onClose }: { term: Term; onClose: () => void }) {
  const { t, termTr } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const card = useCard(term.id);
  const tr = termTr(term);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="term-dialog-title"
      className="border-line bg-surface text-ink m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border p-0 backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <ArticleBadge article={term.de.article} size="lg" />
          <h2 id="term-dialog-title" lang="de" className="text-2xl font-semibold break-all">
            {term.de.word}
          </h2>
          <SpeakButton text={withArticle(term)} />
        </div>
        <p className="text-lg">{tr?.term}</p>
        <p className="text-muted">{tr?.simple}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {card === null && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => void addCard(term.id, term.profession)}
            >
              <Icon name="plus" className="size-4" /> {t('term.addToReview')}
            </Button>
          )}
          {card && (
            <span className="text-good inline-flex items-center gap-1 text-sm">
              <Icon name="check" className="size-4" />
              {t('term.inReview')}
            </span>
          )}
          <Link
            to={`/glossary/${term.id}`}
            className="text-primary inline-flex min-h-9 items-center px-2 text-sm underline"
          >
            {t('situations.openTerm')}
          </Link>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => ref.current?.close()}
          >
            {t('common.close')}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

export default function SituationPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const profile = useActiveProfile();
  const { t, pick } = useI18n();
  const professionId = params.get('prof') ?? profile.profession;
  const content = useProfessionContent(professionId);
  const [showTranslation, setShowTranslation] = useState(true);
  const [open, setOpen] = useState<Term | null>(null);

  if (!content) return <Spinner label={t('common.loading')} />;
  const situation = content.situations.find((s) => s.id === id);
  if (!situation) return <p className="p-6">{t('situations.notFound')}</p>;
  const tr = pick(situation.tr);
  const speakers = [...new Set(situation.lines.map((l) => l.speaker))];

  return (
    <>
      <Link
        to={`/situations${professionId !== profile.profession ? `?prof=${professionId}` : ''}`}
        className="text-primary mb-3 inline-flex min-h-10 items-center gap-1 hover:underline"
      >
        <Icon name="back" /> {t('nav.situations')}
      </Link>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{tr?.title}</h1>
          <p className="text-muted mt-1 max-w-2xl">{tr?.context}</p>
        </div>
        <LevelBadge level={situation.level} />
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          aria-pressed={showTranslation}
          onClick={() => setShowTranslation((v) => !v)}
        >
          {showTranslation ? t('situations.hideTranslation') : t('situations.showTranslation')}
        </Button>
        {speechSupported() && (
          <Button
            size="sm"
            onClick={() => speak(situation.lines.map((l) => stripMarkup(l.de)).join(' '))}
          >
            <Icon name="speaker" className="size-4" /> {t('situations.listenAll')}
          </Button>
        )}
      </div>
      <p className="text-muted mb-4 text-sm">{t('situations.tapHint')}</p>

      <Panel className="p-3 sm:p-5">
        <ol className="flex flex-col gap-3">
          {situation.lines.map((line, i) => {
            const right = speakers.indexOf(line.speaker) % 2 === 1;
            return (
              <li key={i} className={cx('flex', right ? 'justify-end' : 'justify-start')}>
                <div
                  className={cx(
                    'max-w-[88%] rounded-2xl border px-4 py-3',
                    right
                      ? 'border-primary/30 bg-primary-soft rounded-br-sm'
                      : 'border-line bg-surface-2 rounded-bl-sm',
                  )}
                >
                  <p className="label-tech mb-1">{line.speaker}</p>
                  <p lang="de" className="text-[1.05rem] leading-relaxed">
                    {parseMarkup(line.de).map((seg, j) => {
                      const term = seg.termId ? content.byId.get(seg.termId) : undefined;
                      return term ? (
                        <button
                          key={j}
                          type="button"
                          onClick={() => setOpen(term)}
                          className="bg-accent-soft text-accent rounded px-0.5 font-semibold underline decoration-dotted underline-offset-4"
                        >
                          {seg.text}
                        </button>
                      ) : (
                        <span key={j}>{seg.text}</span>
                      );
                    })}
                    {speechSupported() && (
                      <button
                        type="button"
                        onClick={() => speak(stripMarkup(line.de))}
                        className="text-primary hover:bg-surface ml-1 inline-flex size-8 translate-y-1 items-center justify-center rounded-full"
                        aria-label={t('situations.listenLine')}
                      >
                        <Icon name="speaker" className="size-4" />
                      </button>
                    )}
                  </p>
                  {showTranslation && <p className="text-muted mt-1 text-sm">{pick(line.tr)}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>
      {open && <TermDialog term={open} onClose={() => setOpen(null)} />}
    </>
  );
}
