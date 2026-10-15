import { useRef, useState, type ReactNode } from 'react';
import { useActiveProfile } from '@/app/profile';
import { useI18n } from '@/content/locale';
import { locales, professions } from '@/content/loader';
import { LEVELS, REVIEW_STATUS } from '@/content/constants';
import { db } from '@/db/db';
import { savePrefs, saveProfile, usePrefs } from '@/db/hooks';
import { GOALS, type Profile, type ThemePref } from '@/db/types';
import { dayKey } from '@/lib/dates';
import { downloadJson, exportBackup, importBackup } from '@/lib/backup';
import { FocusToggle } from '@/components/FocusToggle';
import { Icon } from '@/components/Icon';
import { StatusBadge } from '@/components/term-bits';
import { Button, PageHeader, Panel } from '@/components/ui';

function Section({ title, children, hint }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Panel className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {hint && <p className="text-muted text-sm">{hint}</p>}
      </div>
      {children}
    </Panel>
  );
}

const select = 'min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3';

export default function Settings() {
  const profile = useActiveProfile();
  const prefs = usePrefs();
  const { t, pick } = useI18n();
  const file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const prof = professions.find((p) => p.id === profile.profession);

  const update = (patch: Partial<Profile>) => void saveProfile({ ...profile, ...patch });

  const doExport = async () => {
    const data = await exportBackup(db);
    downloadJson(data, `ponte-tecnica-${dayKey(Date.now())}.json`);
    setMessage({ ok: true, text: t('settings.exported') });
  };

  const doImport = async (f: File) => {
    let raw: unknown;
    try {
      raw = JSON.parse(await f.text());
    } catch {
      setMessage({ ok: false, text: t('settings.importInvalid') });
      return;
    }
    if (!window.confirm(t('settings.importConfirm'))) return;
    const result = await importBackup(db, raw);
    setMessage(
      result.ok
        ? {
            ok: true,
            text: t('settings.imported', { cards: result.cards, reviews: result.reviews }),
          }
        : { ok: false, text: `${t('settings.importInvalid')} (${result.error})` },
    );
  };

  const reset = async () => {
    if (!window.confirm(t('settings.resetConfirm'))) return;
    await db.delete();
    window.location.assign('/');
  };

  return (
    <>
      <PageHeader kicker={t('settings.kicker')} title={t('settings.title')} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={t('settings.profile')} hint={t('settings.profileHint')}>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t('onboarding.profession.title')}
            <select
              className={select}
              value={profile.profession}
              onChange={(e) => update({ profession: e.target.value, industry: null })}
            >
              {professions.map((p) => (
                <option key={p.id} value={p.id}>
                  {pick(p.tr)?.name ?? p.de}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t('onboarding.industry.title')}
            <select
              className={select}
              value={profile.industry ?? ''}
              onChange={(e) => update({ industry: e.target.value || null })}
            >
              <option value="">{t('onboarding.industry.none')}</option>
              {prof?.industries.map((i) => (
                <option key={i.id} value={i.id}>
                  {pick(i.tr)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              {t('onboarding.level.title')}
              <select
                className={select}
                value={profile.level}
                onChange={(e) => update({ level: e.target.value as Profile['level'] })}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              {t('onboarding.goal.title')}
              <select
                className={select}
                value={profile.goal}
                onChange={(e) => update({ goal: e.target.value as Profile['goal'] })}
              >
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {t(`goal.${g}` as const)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {locales.length > 1 && (
            <label className="flex flex-col gap-1 text-sm font-medium">
              {t('onboarding.locale.title')}
              <select
                className={select}
                value={profile.locale}
                onChange={(e) => update({ locale: e.target.value })}
              >
                {locales.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </Section>

        <Section title={t('settings.study')}>
          <div>
            <FocusToggle />
            <p className="text-muted mt-1 text-sm">{t('settings.focusHint')}</p>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t('settings.theme')}</legend>
            <div className="flex flex-wrap gap-2">
              {(['system', 'light', 'dark'] as ThemePref[]).map((th) => (
                <label
                  key={th}
                  className="border-line-strong has-[:checked]:border-primary has-[:checked]:bg-primary-soft flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3"
                >
                  <input
                    type="radio"
                    name="theme"
                    checked={prefs.theme === th}
                    onChange={() => void savePrefs({ theme: th })}
                    className="accent-[var(--primary)]"
                  />
                  {t(`settings.theme.${th}` as const)}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t('settings.newPerDay')}
            <input
              type="number"
              min={0}
              max={100}
              inputMode="numeric"
              className={select}
              value={prefs.newPerDay}
              onChange={(e) =>
                void savePrefs({
                  newPerDay: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                })
              }
            />
            <span className="text-muted font-normal">{t('settings.newPerDayHint')}</span>
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={prefs.showVariant}
              onChange={(e) => void savePrefs({ showVariant: e.target.checked })}
              className="size-5 accent-[var(--primary)]"
            />
            {t('settings.showVariant')}
          </label>
        </Section>

        <Section title={t('settings.backup')} hint={t('settings.backupHint')}>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => void doExport()}>
              <Icon name="download" /> {t('settings.export')}
            </Button>
            <Button onClick={() => file.current?.click()}>
              <Icon name="upload" /> {t('settings.import')}
            </Button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void doImport(f);
                e.target.value = '';
              }}
            />
          </div>
          <p
            role="status"
            className={message ? (message.ok ? 'text-good' : 'text-bad') : 'sr-only'}
          >
            {message?.text}
          </p>
        </Section>

        <Section title={t('settings.content')} hint={t('settings.contentHint')}>
          <ul className="flex flex-col gap-2 text-sm">
            {REVIEW_STATUS.map((s) => (
              <li key={s} className="flex items-start gap-3">
                <StatusBadge status={s} />
                <span className="text-muted">{t(`status.${s}.hint` as const)}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t('settings.privacy')} hint={t('settings.privacyHint')}>
          <Button variant="danger" className="self-start" onClick={() => void reset()}>
            {t('settings.reset')}
          </Button>
        </Section>
      </div>
    </>
  );
}
