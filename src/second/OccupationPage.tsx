import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n } from '@/content/locale';
import { Icon } from '@/components/Icon';
import { Chip, Panel } from '@/components/ui';
import { cx } from '@/lib/cx';
import { esco, toId, toUri } from './esco/config';
import type { EscoLang } from './esco/languages';
import type { Occupation, Ref, Skill, SkillType } from './esco/types';
import { AsyncView, LangTag, LangText, PortalLink, RefLinks, SpeakButton } from './bits';
import type { LangPair } from './prefs';
import { useAsync } from './useAsync';
import { useSkills } from './useSkills';

type ListKey = 'essential' | 'optional';
type TypeFilter = 'all' | Exclude<SkillType, 'unknown'>;

/** A ocupação nos dois idiomas: a 2ª chamada traz os títulos das habilidades no outro idioma. */
async function loadBoth(uri: string, pair: LangPair) {
  const [learn, know] = await Promise.all([
    esco.occupation(uri, pair.learn),
    esco.occupation(uri, pair.know),
  ]);
  return { learn, know };
}

export default function OccupationPage({ pair }: { pair: LangPair }) {
  const { id = '' } = useParams();
  const uri = toUri('occupation', id);
  const state = useAsync(`${uri}|${pair.learn}|${pair.know}`, () => loadBoth(uri, pair));
  return (
    <AsyncView state={state}>
      {({ learn, know }) => <OccupationView occ={learn} other={know} pair={pair} />}
    </AsyncView>
  );
}

function OccupationView({
  occ,
  other,
  pair,
}: {
  occ: Occupation;
  other: Occupation;
  pair: LangPair;
}) {
  const { t } = useI18n();
  const [list, setList] = useState<ListKey>('essential');
  const [type, setType] = useState<TypeFilter>('all');

  const knowTitle = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of [...other.essential, ...other.optional]) m.set(r.uri, r.title);
    return m;
  }, [other]);
  const allUris = useMemo(() => [...occ.essential, ...occ.optional].map((r) => r.uri), [occ]);
  const { skills, done, total } = useSkills(allUris, pair.learn);

  const title = occ.labels[pair.learn];
  const visible = occ[list].filter((r) => type === 'all' || skills.get(r.uri)?.type === type);
  const countType = (refs: Ref[], k: SkillType) =>
    refs.filter((r) => skills.get(r.uri)?.type === k).length;

  return (
    <>
      <div className="mb-6">
        <p className="label-tech mb-1 [overflow-wrap:anywhere]">
          {occ.code ? t('esco.occ.kicker', { code: occ.code }) : t('esco.occ.kickerNoCode')}
        </p>
        <h1 className="flex min-w-0 items-start gap-1 text-2xl font-semibold tracking-tight md:text-3xl">
          <LangText lang={pair.learn} text={title} />
          <SpeakButton text={title} lang={pair.learn} />
        </h1>
        <p className="text-muted mt-1 text-lg">
          <LangText lang={pair.know} text={occ.labels[pair.know]} />
        </p>
      </div>

      <section aria-labelledby="occ-desc" className="mb-6">
        <h2 id="occ-desc" className="label-tech mb-2">
          {t('esco.occ.description')}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[pair.learn, pair.know].map((l) => (
            <Panel key={l} className="p-4">
              <LangTag lang={l} className="mb-2" />
              <p className="leading-relaxed">
                <LangText lang={l} text={occ.descriptions[l]} />
              </p>
            </Panel>
          ))}
        </div>
      </section>

      <AltLabels occ={occ} pair={pair} />

      {occ.isco.length > 0 && (
        <p className="text-muted mb-6 text-sm">
          {t('esco.occ.isco')}: {occ.isco.map((r) => r.title).join(', ')}
        </p>
      )}

      <section aria-labelledby="occ-skills" className="mb-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="occ-skills" className="text-xl font-semibold">
              {t('esco.occ.skillsTitle')}
            </h2>
            <p className="text-muted text-sm">{t('esco.occ.skillsHint')}</p>
          </div>
          <Link
            to={`/second/o/${toId(occ.uri)}/praticar`}
            className="bg-primary text-primary-ink inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-medium hover:brightness-110"
          >
            <Icon name="practice" /> {t('esco.occ.practice')}
          </Link>
        </div>

        <div
          className="mb-2 flex flex-wrap gap-2"
          role="group"
          aria-label={t('esco.occ.skillsTitle')}
        >
          {(['essential', 'optional'] as const).map((k) => (
            <Chip key={k} active={list === k} onClick={() => setList(k)}>
              {t(k === 'essential' ? 'esco.occ.essential' : 'esco.occ.optional')} · {occ[k].length}
            </Chip>
          ))}
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2" role="group">
          <Chip active={type === 'all'} onClick={() => setType('all')}>
            {t('esco.occ.all')}
          </Chip>
          <Chip active={type === 'knowledge'} onClick={() => setType('knowledge')}>
            {t('esco.occ.knowledge')} · {countType(occ[list], 'knowledge')}
          </Chip>
          <Chip active={type === 'skill'} onClick={() => setType('skill')}>
            {t('esco.occ.skills')} · {countType(occ[list], 'skill')}
          </Chip>
          {done < total && (
            <span className="text-muted text-sm" aria-live="polite">
              {t('esco.occ.classifying', { done, total })}
            </span>
          )}
        </div>

        {visible.length === 0 ? (
          <p className="text-muted">{t('esco.occ.none')}</p>
        ) : (
          <ul className="border-line bg-surface divide-line divide-y rounded-xl border">
            {visible.map((r) => (
              <SkillRow
                key={r.uri}
                refLearn={r}
                knowLabel={knowTitle.get(r.uri)}
                skill={skills.get(r.uri)}
                pair={pair}
              />
            ))}
          </ul>
        )}
      </section>

      {(occ.broader.length > 0 || occ.narrower.length > 0) && (
        <section aria-labelledby="occ-rel" className="mb-6">
          <h2 id="occ-rel" className="mb-3 text-xl font-semibold">
            {t('esco.occ.related')}
          </h2>
          {occ.broader.length > 0 && (
            <div className="mb-3">
              <p className="label-tech mb-2">{t('esco.occ.broader')}</p>
              <RefLinks refs={occ.broader} kind="o" />
            </div>
          )}
          {occ.narrower.length > 0 && (
            <div>
              <p className="label-tech mb-2">{t('esco.occ.narrower')}</p>
              <RefLinks refs={occ.narrower} kind="o" />
            </div>
          )}
        </section>
      )}

      <PortalLink uri={occ.uri} />
    </>
  );
}

function AltLabels({ occ, pair }: { occ: Occupation; pair: LangPair }) {
  const { t } = useI18n();
  const langs = [pair.learn, pair.know].filter((l) => occ.altLabels[l]?.length);
  if (!langs.length) return null;
  return (
    <details className="border-line bg-surface mb-6 rounded-xl border">
      <summary className="min-h-11 cursor-pointer px-4 py-3 font-medium">
        {t('esco.occ.altLabels')}
      </summary>
      <div className="grid gap-4 px-4 pb-4 md:grid-cols-2">
        {langs.map((l: EscoLang) => (
          <div key={l}>
            <LangTag lang={l} className="mb-2" />
            <ul className="space-y-1">
              {occ.altLabels[l]?.map((a) => (
                <li key={a}>
                  <LangText lang={l} text={a} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}

function SkillRow({
  refLearn,
  knowLabel,
  skill,
  pair,
}: {
  refLearn: Ref;
  knowLabel: string | undefined;
  skill: Skill | undefined;
  pair: LangPair;
}) {
  const { t } = useI18n();
  const type = skill?.type ?? 'unknown';
  return (
    <li>
      <Link
        to={`/second/s/${toId(refLearn.uri)}`}
        className="hover:bg-surface-2 flex min-h-12 items-center gap-3 px-4 py-3"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-medium">
            <LangText lang={pair.learn} text={skill?.labels[pair.learn] ?? refLearn.title} />
          </span>
          <span className="text-muted block text-sm">
            <LangText lang={pair.know} text={skill?.labels[pair.know] ?? knowLabel} />
          </span>
        </span>
        <span
          className={cx(
            'shrink-0 rounded-full px-2 py-0.5 text-xs',
            type === 'knowledge' && 'bg-accent-soft',
            type === 'skill' && 'bg-primary-soft text-primary',
          )}
        >
          {t(`esco.type.${type}` as const)}
        </span>
        <Icon name="chevron" className="text-muted size-4 shrink-0" />
      </Link>
    </li>
  );
}
