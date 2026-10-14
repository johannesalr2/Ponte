import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useI18n } from '@/content/locale';
import type { ProfessionContent } from '@/content/loader';
import { db } from '@/db/db';
import type { Bilingual, CvEntry, CvRow } from '@/db/types';
import { CV_DE, emptyCv, renderCv, type CvHeadings } from '@/lib/cv';
import { Icon } from '@/components/Icon';
import { Button, Panel } from '@/components/ui';
import { cx } from '@/lib/cx';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // alternativa para navegadores sem a API de área de transferência
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

const input = 'min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function BilingualField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: Bilingual;
  onChange: (v: Bilingual) => void;
  multiline?: boolean;
}) {
  const { t } = useI18n();
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <fieldset className="grid gap-2 sm:grid-cols-2">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <label className="text-muted flex flex-col gap-1 text-xs">
        {t('cv.inGerman')}
        <Tag
          lang="de"
          className={cx(input, 'text-ink text-sm', multiline && 'min-h-20 py-2')}
          value={value.de}
          onChange={(e) => onChange({ ...value, de: e.target.value })}
        />
      </label>
      <label className="text-muted flex flex-col gap-1 text-xs">
        {t('cv.inLocale')}
        <Tag
          className={cx(input, 'text-ink text-sm', multiline && 'min-h-20 py-2')}
          value={value.pt}
          onChange={(e) => onChange({ ...value, pt: e.target.value })}
        />
      </label>
    </fieldset>
  );
}

function EntryList({
  title,
  entries,
  onChange,
}: {
  title: string;
  entries: CvEntry[];
  onChange: (e: CvEntry[]) => void;
}) {
  const { t } = useI18n();
  const update = (i: number, patch: Partial<CvEntry>) =>
    onChange(entries.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-semibold">{title}</h3>
      {entries.map((e, i) => (
        <div key={e.id} className="border-line flex flex-col gap-3 rounded-lg border p-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('cv.from')}>
              <input
                className={input}
                value={e.from}
                placeholder="03/2021"
                onChange={(ev) => update(i, { from: ev.target.value })}
              />
            </Field>
            <Field label={t('cv.to')}>
              <input
                className={input}
                value={e.to}
                placeholder={t('cv.toPlaceholder')}
                onChange={(ev) => update(i, { to: ev.target.value })}
              />
            </Field>
          </div>
          <BilingualField
            label={t('cv.role')}
            value={e.title}
            onChange={(v) => update(i, { title: v })}
          />
          <Field label={t('cv.place')}>
            <input
              className={input}
              value={e.place}
              onChange={(ev) => update(i, { place: ev.target.value })}
            />
          </Field>
          <BilingualField
            label={t('cv.details')}
            value={e.details}
            multiline
            onChange={(v) => update(i, { details: v })}
          />
          <Button
            size="sm"
            variant="danger"
            className="self-end"
            onClick={() => onChange(entries.filter((_, j) => j !== i))}
          >
            {t('cv.remove')}
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        className="self-start"
        onClick={() =>
          onChange([
            ...entries,
            {
              id: crypto.randomUUID(),
              from: '',
              to: '',
              title: { de: '', pt: '' },
              place: '',
              details: { de: '', pt: '' },
            },
          ])
        }
      >
        <Icon name="plus" className="size-4" /> {t('cv.add')}
      </Button>
    </section>
  );
}

export function CvBuilder({ content }: { content: ProfessionContent }) {
  const { t, pick, termTr } = useI18n();
  const stored = useLiveQuery(async () => (await db.cv.get('main')) ?? null);
  const [cv, setCv] = useState<CvRow | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || stored === undefined) return;
    loaded.current = true;
    setCv(
      stored ?? emptyCv({ german: t('cv.german'), mother: t('cv.mother'), native: t('cv.native') }),
    );
  }, [stored, t]);

  // salva automaticamente (só no aparelho)
  useEffect(() => {
    if (!cv || !loaded.current) return;
    const id = window.setTimeout(() => void db.cv.put({ ...cv, updatedAt: Date.now() }), 400);
    return () => window.clearTimeout(id);
  }, [cv]);

  const profTr = pick(content.profession.tr);
  const skills = useMemo(
    () =>
      (cv?.skills ?? [])
        .map((id) => content.byId.get(id))
        .filter((x) => x !== undefined)
        .map((term) => ({ de: term.de.word, pt: termTr(term)?.term ?? term.de.word })),
    [cv?.skills, content, termTr],
  );

  if (!cv) return null;
  const set = (patch: Partial<CvRow>) => setCv({ ...cv, ...patch });

  const ptHeadings: CvHeadings = {
    title: t('cv.h.title'),
    contact: t('cv.h.contact'),
    profile: t('cv.h.profile'),
    experience: t('cv.h.experience'),
    education: t('cv.h.education'),
    skills: t('cv.h.skills'),
    languages: t('cv.h.languages'),
    today: t('cv.h.today'),
  };
  const de = renderCv(cv, 'de', CV_DE, content.profession.deTitleCv, skills);
  const pt = renderCv(cv, 'pt', ptHeadings, profTr?.cvTitle ?? '', skills);
  const both = `${CV_DE.title}\n${'='.repeat(CV_DE.title.length)}\n${de}\n\n\n${ptHeadings.title}\n${'='.repeat(ptHeadings.title.length)}\n${pt}`;

  const copy = async (key: string, text: string) => {
    if (await copyText(text)) {
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="flex flex-col gap-5 p-5">
        <p className="bg-surface-2 text-muted rounded-lg p-3 text-sm">{t('cv.privacy')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('cv.name')}>
            <input
              className={input}
              value={cv.name}
              autoComplete="name"
              onChange={(e) => set({ name: e.target.value })}
            />
          </Field>
          <Field label={t('cv.city')}>
            <input
              className={input}
              value={cv.city}
              onChange={(e) => set({ city: e.target.value })}
            />
          </Field>
          <Field label={t('cv.email')}>
            <input
              className={input}
              type="email"
              value={cv.email}
              autoComplete="email"
              onChange={(e) => set({ email: e.target.value })}
            />
          </Field>
          <Field label={t('cv.phone')}>
            <input
              className={input}
              type="tel"
              value={cv.phone}
              autoComplete="tel"
              onChange={(e) => set({ phone: e.target.value })}
            />
          </Field>
        </div>
        <BilingualField
          label={t('cv.h.profile')}
          value={cv.profile}
          multiline
          onChange={(v) => set({ profile: v })}
        />
        <EntryList
          title={t('cv.h.experience')}
          entries={cv.experience}
          onChange={(experience) => set({ experience })}
        />
        <EntryList
          title={t('cv.h.education')}
          entries={cv.education}
          onChange={(education) => set({ education })}
        />

        <section>
          <h3 className="font-semibold">{t('cv.h.skills')}</h3>
          <p className="text-muted mb-2 text-sm">{t('cv.skillsHint')}</p>
          <div className="border-line flex max-h-72 flex-col gap-3 overflow-y-auto rounded-lg border p-3">
            {content.profession.areas.map((a) => (
              <fieldset key={a.id}>
                <legend className="label-tech mb-1">{pick(a.tr)}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {content.terms
                    .filter((tm) => tm.area === a.id && tm.de.pos === 'noun')
                    .map((tm) => {
                      const on = cv.skills.includes(tm.id);
                      return (
                        <label
                          key={tm.id}
                          className={cx(
                            'has-[:focus-visible]:outline-accent cursor-pointer rounded-full border px-2.5 py-1 text-sm has-[:focus-visible]:outline-3',
                            on ? 'border-primary bg-primary-soft' : 'border-line-strong',
                          )}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={on}
                            onChange={() =>
                              set({
                                skills: on
                                  ? cv.skills.filter((s) => s !== tm.id)
                                  : [...cv.skills, tm.id],
                              })
                            }
                          />
                          <span lang="de">{tm.de.word}</span>
                        </label>
                      );
                    })}
                </div>
              </fieldset>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-semibold">{t('cv.h.languages')}</h3>
          {cv.languages.map((l, i) => (
            <div key={i} className="border-line flex flex-col gap-2 rounded-lg border p-3">
              <BilingualField
                label={t('cv.language')}
                value={l.name}
                onChange={(name) =>
                  set({ languages: cv.languages.map((x, j) => (j === i ? { ...x, name } : x)) })
                }
              />
              <BilingualField
                label={t('cv.languageLevel')}
                value={l.level}
                onChange={(level) =>
                  set({ languages: cv.languages.map((x, j) => (j === i ? { ...x, level } : x)) })
                }
              />
              <Button
                size="sm"
                variant="danger"
                className="self-end"
                onClick={() => set({ languages: cv.languages.filter((_, j) => j !== i) })}
              >
                {t('cv.remove')}
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            className="self-start"
            onClick={() =>
              set({
                languages: [
                  ...cv.languages,
                  { name: { de: '', pt: '' }, level: { de: '', pt: '' } },
                ],
              })
            }
          >
            <Icon name="plus" className="size-4" /> {t('cv.addLanguage')}
          </Button>
        </section>
      </Panel>

      <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
        {(
          [
            ['de', CV_DE.title, de],
            ['pt', ptHeadings.title, pt],
          ] as const
        ).map(([key, title, text]) => (
          <Panel key={key} className="overflow-hidden">
            <div className="border-line flex items-center justify-between gap-2 border-b px-4 py-2">
              <h3 className="font-semibold">{title}</h3>
              <Button size="sm" onClick={() => void copy(key, text)}>
                <Icon name={copied === key ? 'check' : 'copy'} className="size-4" />
                {copied === key ? t('cv.copied') : t('cv.copy')}
              </Button>
            </div>
            <pre
              lang={key === 'de' ? 'de' : undefined}
              className="max-h-80 overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap"
            >
              {text}
            </pre>
          </Panel>
        ))}
        <Button variant="primary" onClick={() => void copy('both', both)}>
          <Icon name={copied === 'both' ? 'check' : 'copy'} />
          {copied === 'both' ? t('cv.copied') : t('cv.copyBoth')}
        </Button>
        <p aria-live="polite" className="sr-only">
          {copied ? t('cv.copied') : ''}
        </p>
        <p className="text-muted text-xs">{t('cv.tip')}</p>
      </div>
    </div>
  );
}
