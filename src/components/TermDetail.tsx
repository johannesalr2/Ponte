import { Link } from 'react-router-dom';
import { useI18n } from '@/content/locale';
import { getProfession } from '@/content/loader';
import type { Term } from '@/content/schema';
import { addCard, removeCard, savePrefs, useCard, usePrefs } from '@/db/hooks';
import { formatInterval } from '@/lib/fsrs';
import { Icon } from './Icon';
import { ArticleBadge, LevelBadge, SpeakButton, StatusBadge } from './term-bits';
import { withArticle } from '@/lib/term';
import { Button, Panel } from './ui';
import { cx } from '@/lib/cx';

function Cell({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('border-line px-3 py-2', className)}>
      <dt className="label-tech">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{children}</dd>
    </div>
  );
}

/** Ficha completa do termo, com layout de "legenda de desenho técnico". */
export function TermDetail({ term, related }: { term: Term; related: Term[] }) {
  const { t, pick, termTr, locale } = useI18n();
  const prefs = usePrefs();
  const card = useCard(term.id);
  const tr = termTr(term);
  const profession = getProfession(term.profession);
  const area = profession?.areas.find((a) => a.id === term.area);
  const variantLabels = new Map(locale.variants.map((v) => [v.code, v.label]));
  const due = card && card.state !== 'new' ? formatInterval(card, Date.now()) : null;

  return (
    <article className="flex flex-col gap-4">
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-2 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <ArticleBadge article={term.de.article} size="lg" />
            <h1 lang="de" className="text-3xl font-semibold tracking-tight break-all sm:text-4xl">
              {term.de.word}
            </h1>
            <SpeakButton text={withArticle(term)} />
          </div>
          <p className="flex items-center gap-1 text-xl">
            {tr?.term ?? t('term.noTranslation')}
            {tr && <SpeakButton text={tr.term} lang={locale.speechLang} />}
          </p>
          {prefs.showVariant &&
            Object.entries(tr?.variants ?? {}).map(([code, value]) => (
              <p key={code} className="text-muted text-sm">
                {t('term.variant', { region: variantLabels.get(code) ?? code })}{' '}
                <span className="text-ink font-medium">{value}</span>
              </p>
            ))}
        </div>
        <dl className="border-line grid grid-cols-2 border-t sm:grid-cols-4 [&>div]:border-b sm:[&>div]:border-r [&>div:nth-child(odd)]:border-r">
          <Cell label={t('term.article')}>
            {term.de.article
              ? `${term.de.article} · ${t(`gender.${term.de.gender ?? 'm'}` as const)}`
              : '—'}
          </Cell>
          <Cell label={t('term.plural')}>
            <span lang="de">
              {term.de.plural
                ? `die ${term.de.plural}`
                : term.de.pos === 'noun'
                  ? t('term.noPlural')
                  : '—'}
            </span>
          </Cell>
          <Cell label={t('term.pos')}>{t(`pos.${term.de.pos}` as const)}</Cell>
          <Cell label={t('term.level')}>
            <LevelBadge level={term.level} />
          </Cell>
          <Cell label={t('term.area')} className="col-span-2">
            {pick(area?.tr)} <span className="text-muted">· {pick(profession?.tr)?.name}</span>
          </Cell>
          <Cell label={t('term.status')}>
            <StatusBadge status={term.status} />
          </Cell>
          <Cell label="ESCO">
            {term.esco ? (
              <a
                href={term.esco.uri}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                {term.esco.label}
              </a>
            ) : (
              <span className="text-muted">{t('term.noEsco')}</span>
            )}
          </Cell>
        </dl>
      </Panel>

      {term.parts && (
        <Panel className="p-5">
          <h2 className="mb-3 font-semibold">{t('term.parts')}</h2>
          <ol className="flex flex-wrap items-stretch gap-2">
            {term.parts.map((part, i) => (
              <li key={i} className="flex items-center gap-2">
                {i > 0 && (
                  <span aria-hidden="true" className="text-muted font-mono">
                    +
                  </span>
                )}
                <span className="border-line-strong bg-surface-2 rounded-lg border px-3 py-2">
                  <span lang="de" className="block font-mono font-semibold">
                    {part.de}
                  </span>
                  <span className="text-muted block text-xs">{pick(part.tr)}</span>
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <Panel className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{t('term.explanation')}</h2>
          <div
            role="group"
            aria-label={t('glossary.mode')}
            className="border-line-strong flex rounded-lg border p-0.5"
          >
            {(['technical', 'simple'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={prefs.explanation === m}
                onClick={() => void savePrefs({ explanation: m })}
                className={cx(
                  'min-h-9 rounded-md px-3 text-sm',
                  prefs.explanation === m ? 'bg-primary text-primary-ink' : 'hover:bg-surface-2',
                )}
              >
                {t(`glossary.mode.${m}` as const)}
              </button>
            ))}
          </div>
        </div>
        <p className="text-lg leading-relaxed">
          {prefs.explanation === 'simple' ? tr?.simple : tr?.technical}
        </p>
      </Panel>

      <Panel className="p-5">
        <h2 className="mb-3 font-semibold">{t('term.examples')}</h2>
        <ul className="flex flex-col gap-4">
          {term.examples.map((ex, i) => (
            <li key={i} className="border-primary border-l-4 pl-3">
              <p lang="de" className="flex items-start gap-1 font-medium">
                <span className="flex-1">{ex.de}</span>
                <SpeakButton text={ex.de} className="-mt-2 size-9" />
              </p>
              <p className="text-muted">{pick(ex.tr)}</p>
            </li>
          ))}
        </ul>
      </Panel>

      {(tr?.falseFriends?.length ?? 0) > 0 && (
        <Panel className="border-accent bg-accent-soft p-5">
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <span aria-hidden="true">⚠</span> {t('term.falseFriends')}
          </h2>
          <ul className="flex flex-col gap-2">
            {tr?.falseFriends?.map((ff) => (
              <li key={ff.word}>
                <span className="font-semibold">{ff.word}:</span> {ff.note}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {(term.synonyms.length > 0 || related.length > 0) && (
        <Panel className="grid gap-4 p-5 sm:grid-cols-2">
          {term.synonyms.length > 0 && (
            <div>
              <h2 className="mb-2 font-semibold">{t('term.synonyms')}</h2>
              <ul className="flex flex-wrap gap-2">
                {term.synonyms.map((s) => (
                  <li
                    key={s}
                    lang="de"
                    className="border-line-strong rounded-full border px-3 py-1 text-sm"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {related.length > 0 && (
            <div>
              <h2 className="mb-2 font-semibold">{t('term.related')}</h2>
              <ul className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/glossary/${r.id}`}
                      className="border-line-strong hover:border-primary inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm"
                    >
                      {r.de.article && (
                        <span className="text-muted font-mono text-xs">{r.de.article}</span>
                      )}
                      <span lang="de">{r.de.word}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      )}

      <Panel className="flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-muted text-sm">
          {card === undefined
            ? ''
            : card === null
              ? t('term.notInReview')
              : due
                ? t('term.nextReview', { value: due.value, unit: t(`unit.${due.unit}` as const) })
                : t('term.newInReview')}
        </p>
        {card === null ? (
          <Button variant="primary" onClick={() => void addCard(term.id, term.profession)}>
            <Icon name="plus" /> {t('term.addToReview')}
          </Button>
        ) : card ? (
          <Button variant="ghost" onClick={() => void removeCard(term.id)}>
            {t('term.removeFromReview')}
          </Button>
        ) : null}
      </Panel>
    </article>
  );
}
