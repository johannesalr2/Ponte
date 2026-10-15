import { useDeferredValue, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useActiveProfile } from '@/app/profile';
import { useI18n } from '@/content/locale';
import { professions, useProfessionContent } from '@/content/loader';
import { LEVELS } from '@/content/constants';
import type { Level } from '@/content/schema';
import { savePrefs, useCards, usePrefs } from '@/db/hooks';
import { search } from '@/lib/search';
import { Icon } from '@/components/Icon';
import { ArticleBadge, LevelBadge } from '@/components/term-bits';
import { Chip, PageHeader, Spinner } from '@/components/ui';
import { cx } from '@/lib/cx';
import { useTermIndex } from './useTermIndex';

export default function Glossary() {
  const profile = useActiveProfile();
  const prefs = usePrefs();
  const { t, tp, pick, termTr, number } = useI18n();
  const [params, setParams] = useSearchParams();
  const professionId = params.get('prof') ?? profile.profession;
  const area = params.get('area');
  const level = params.get('level') as Level | null;
  const query = params.get('q') ?? '';
  const deferredQuery = useDeferredValue(query);

  const content = useProfessionContent(professionId);
  const index = useTermIndex(content?.terms);
  const cards = useCards();
  const inReview = useMemo(() => new Set(cards?.map((c) => c.termId)), [cards]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'prof') next.delete('area');
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    if (!content || !index) return [];
    const base = deferredQuery.trim()
      ? search(index, deferredQuery, 500).map((h) => h.item)
      : content.terms;
    return base.filter((term) => (!area || term.area === area) && (!level || term.level === level));
  }, [content, index, deferredQuery, area, level]);

  return (
    <>
      <PageHeader kicker={t('glossary.kicker')} title={t('glossary.title')}>
        <div
          role="group"
          aria-label={t('glossary.mode')}
          className="border-line-strong bg-surface flex rounded-lg border p-0.5"
        >
          {(['technical', 'simple'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={prefs.explanation === m}
              onClick={() => void savePrefs({ explanation: m })}
              className={cx(
                'min-h-9 rounded-md px-3 text-sm',
                prefs.explanation === m
                  ? 'bg-primary text-primary-ink'
                  : 'text-ink hover:bg-surface-2',
              )}
            >
              {t(`glossary.mode.${m}` as const)}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">{t('glossary.search')}</span>
            <Icon
              name="search"
              className="text-muted pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder={t('glossary.searchPlaceholder')}
              className="border-line-strong bg-surface placeholder:text-muted min-h-12 w-full rounded-lg border pr-3 pl-10 text-base"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="sm:w-64">
            <span className="sr-only">{t('glossary.profession')}</span>
            <select
              value={professionId}
              onChange={(e) =>
                setParam('prof', e.target.value === profile.profession ? null : e.target.value)
              }
              className="border-line-strong bg-surface min-h-12 w-full rounded-lg border px-3"
            >
              {professions.map((p) => (
                <option key={p.id} value={p.id}>
                  {pick(p.tr)?.name ?? p.de}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label={t('glossary.filterArea')}
        >
          <Chip active={!area} onClick={() => setParam('area', null)}>
            {t('glossary.allAreas')}
          </Chip>
          {content?.profession.areas.map((a) => (
            <Chip
              key={a.id}
              active={area === a.id}
              onClick={() => setParam('area', area === a.id ? null : a.id)}
            >
              {pick(a.tr)}
            </Chip>
          ))}
        </div>
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label={t('glossary.filterLevel')}
        >
          <Chip active={!level} onClick={() => setParam('level', null)}>
            {t('glossary.allLevels')}
          </Chip>
          {LEVELS.map((l) => (
            <Chip
              key={l}
              active={level === l}
              onClick={() => setParam('level', level === l ? null : l)}
              className="font-mono"
            >
              {l}
            </Chip>
          ))}
        </div>
      </div>

      {!content ? (
        <Spinner label={t('common.loading')} />
      ) : (
        <>
          <p className="text-muted mb-2 text-sm" aria-live="polite">
            {tp('glossary.results', results.length)}
          </p>
          {results.length === 0 ? (
            <p className="border-line-strong text-muted rounded-xl border border-dashed p-8 text-center">
              {t('glossary.empty')}
            </p>
          ) : (
            <ul className="grid gap-2 lg:grid-cols-2">
              {results.map((term) => {
                const tr = termTr(term);
                return (
                  <li key={term.id}>
                    <Link
                      to={`/glossary/${term.id}`}
                      className="border-line bg-surface hover:border-primary flex h-full items-start gap-3 rounded-xl border p-4 transition-colors"
                    >
                      <span className="w-12 shrink-0 pt-0.5">
                        <ArticleBadge article={term.de.article} size="sm" />
                      </span>
                      <span className="min-w-0 flex-1">
                        {/* o alemão é sempre o título do card, qualquer que seja o idioma em foco */}
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span lang="de" className="font-semibold break-words">
                            {term.de.word}
                          </span>
                          {term.de.plural && (
                            <span lang="de" className="text-muted text-sm">
                              {t('term.pluralShort', { plural: term.de.plural })}
                            </span>
                          )}
                        </span>
                        <span className="block">{tr?.term ?? t('term.noTranslation')}</span>
                        <span className="text-muted mt-1 line-clamp-2 block text-sm">
                          {prefs.explanation === 'simple' ? tr?.simple : tr?.technical}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1.5">
                        <LevelBadge level={term.level} />
                        {inReview.has(term.id) && (
                          <span className="text-good" title={t('term.inReview')}>
                            <Icon name="check" className="size-4" label={t('term.inReview')} />
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-muted mt-6 text-center text-xs">
            {t('glossary.count', { count: number(content.terms.length) })}
          </p>
        </>
      )}
    </>
  );
}
