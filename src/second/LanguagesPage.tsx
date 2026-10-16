import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/content/locale';
import { Button, PageHeader, Panel } from '@/components/ui';
import { ESCO_LANGUAGES, type EscoLang } from './esco/languages';
import type { LangPair } from './prefs';

const SELECT =
  'border-line-strong bg-surface min-h-11 w-full rounded-lg border px-3 focus-visible:outline-2';

/** Escolha (e troca) do par de idiomas. Aparece sozinha no primeiro acesso. */
export default function LanguagesPage({
  pair,
  onSave,
}: {
  pair: LangPair | null;
  onSave: (p: LangPair) => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [learn, setLearn] = useState<EscoLang>(pair?.learn ?? 'de');
  const [know, setKnow] = useState<EscoLang>(pair?.know ?? 'pt');
  const same = learn === know;

  const field = (label: string, value: EscoLang, set: (v: EscoLang) => void, id: string) => (
    <div className="flex-1">
      <label htmlFor={id} className="mb-1.5 block font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => set(e.target.value as EscoLang)}
        className={SELECT}
      >
        {ESCO_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name} ({l.code})
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <PageHeader title={t('esco.langs.title')} kicker={t('esco.langs.kicker')} />
      <p className="text-muted mb-5 max-w-prose">
        {t('esco.langs.intro', { count: ESCO_LANGUAGES.length })}
      </p>
      <Panel className="p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (same) return;
            onSave({ learn, know });
            void navigate('/second');
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {field(t('esco.langs.learn'), learn, setLearn, 'esco-learn')}
            <Button
              variant="ghost"
              className="self-center sm:self-end"
              onClick={() => {
                setLearn(know);
                setKnow(learn);
              }}
              aria-label={t('esco.langs.swap')}
              title={t('esco.langs.swap')}
            >
              <span aria-hidden="true" className="text-lg">
                ⇄
              </span>
            </Button>
            {field(t('esco.langs.know'), know, setKnow, 'esco-know')}
          </div>
          {same && (
            <p role="alert" className="text-bad mt-3 text-sm">
              {t('esco.langs.same')}
            </p>
          )}
          {(learn === 'pt' || know === 'pt') && (
            <p className="bg-accent-soft mt-4 rounded-lg p-3 text-sm">{t('esco.langs.ptNote')}</p>
          )}
          <Button type="submit" variant="primary" className="mt-5" disabled={same}>
            {t('esco.langs.save')}
          </Button>
        </form>
      </Panel>
    </>
  );
}
