import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '@/content/locale';
import { Button, Panel } from '@/components/ui';
import { esco, toUri } from './esco/config';
import type { EscoLang } from './esco/languages';
import type { Ref, Skill } from './esco/types';
import { AsyncView, LangTag, LangText, PortalLink, RefLinks, SpeakButton } from './bits';
import type { LangPair } from './prefs';
import { useAsync } from './useAsync';

const PREVIEW = 12;

export default function SkillPage({ pair }: { pair: LangPair }) {
  const { id = '' } = useParams();
  const uri = toUri('skill', id);
  const state = useAsync(`${uri}|${pair.learn}`, () => esco.skill(uri, pair.learn));
  return <AsyncView state={state}>{(s) => <SkillView skill={s} pair={pair} />}</AsyncView>;
}

function SkillView({ skill, pair }: { skill: Skill; pair: LangPair }) {
  const { t } = useI18n();
  const title = skill.labels[pair.learn];
  const langs: EscoLang[] = [pair.learn, pair.know];
  return (
    <>
      <div className="mb-6">
        <p className="label-tech mb-1 [overflow-wrap:anywhere]">
          {t(skill.type === 'knowledge' ? 'esco.skill.kickerKnowledge' : 'esco.skill.kicker')}
        </p>
        <h1 className="flex min-w-0 items-start gap-1 text-2xl font-semibold tracking-tight md:text-3xl">
          <LangText lang={pair.learn} text={title} />
          <SpeakButton text={title} lang={pair.learn} />
        </h1>
        <p className="text-muted mt-1 text-lg">
          <LangText lang={pair.know} text={skill.labels[pair.know]} />
        </p>
        {skill.reuse && (
          <p className="text-muted mt-3 text-sm">
            {t('esco.skill.reuse')}: {t(`esco.reuse.${skill.reuse}` as const)}
          </p>
        )}
      </div>

      <section className="mb-6 grid gap-3 md:grid-cols-2" aria-label={t('esco.occ.description')}>
        {langs.map((l) => (
          <Panel key={l} className="p-4">
            <LangTag lang={l} className="mb-2" />
            <p className="leading-relaxed">
              <LangText lang={l} text={skill.descriptions[l]} />
            </p>
            {skill.altLabels[l]?.length ? (
              <>
                <p className="label-tech mt-4 mb-1">{t('esco.occ.altLabels')}</p>
                <p className="text-muted text-sm">
                  <LangText lang={l} text={skill.altLabels[l]?.join(' · ')} />
                </p>
              </>
            ) : null}
          </Panel>
        ))}
      </section>

      {skill.broader.length > 0 && (
        <section className="mb-6">
          <h2 className="label-tech mb-2">{t('esco.skill.broader')}</h2>
          <RefLinks refs={skill.broader} kind="s" />
        </section>
      )}
      <OccupationList title={t('esco.skill.essentialFor')} refs={skill.essentialFor} />
      <OccupationList title={t('esco.skill.optionalFor')} refs={skill.optionalFor} />
      <PortalLink uri={skill.uri} />
    </>
  );
}

function OccupationList({ title, refs }: { title: string; refs: Ref[] }) {
  const { t } = useI18n();
  const [all, setAll] = useState(false);
  if (!refs.length) return null;
  const sorted = [...refs].sort((a, b) => a.title.localeCompare(b.title));
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-xl font-semibold">
        {title} <span className="text-muted text-base font-normal">· {refs.length}</span>
      </h2>
      <RefLinks refs={all ? sorted : sorted.slice(0, PREVIEW)} kind="o" />
      {!all && refs.length > PREVIEW && (
        <Button size="sm" className="mt-3" onClick={() => setAll(true)}>
          {t('esco.skill.showAll', { count: refs.length })}
        </Button>
      )}
    </section>
  );
}
