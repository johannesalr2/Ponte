import { useId, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE } from '@/content/config';
import { useI18n } from '@/content/locale';
import { locales, professions } from '@/content/loader';
import { LEVELS } from '@/content/constants';
import type { Level } from '@/content/schema';
import { savePrefs, saveProfile } from '@/db/hooks';
import { GOALS, type Goal } from '@/db/types';
import type { Focus } from '@/lib/exercises';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui';
import { cx } from '@/lib/cx';

type Step = 'locale' | 'profession' | 'industry' | 'level' | 'focus' | 'goal';

function Option({
  selected,
  onSelect,
  title,
  description,
  name,
  value,
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  name: string;
  value: string;
}) {
  return (
    <label
      className={cx(
        'has-[:focus-visible]:outline-accent flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:outline-3',
        selected ? 'border-primary bg-primary-soft' : 'border-line bg-surface hover:bg-surface-2',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        className="mt-1 size-4 accent-[var(--primary)]"
      />
      <span>
        <span className="block font-medium">{title}</span>
        {description && <span className="text-muted mt-0.5 block text-sm">{description}</span>}
      </span>
    </label>
  );
}

export default function Onboarding() {
  const { t, pick } = useI18n();
  const steps: Step[] = [
    ...(locales.length > 1 ? (['locale'] as const) : []),
    'profession',
    'industry',
    'level',
    'focus',
    'goal',
  ];
  const [index, setIndex] = useState(0);
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [profession, setProfession] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [focus, setFocus] = useState<Focus>('de');
  const [goal, setGoal] = useState<Goal | null>(null);
  const headingId = useId();

  const step = steps[index] ?? 'profession';
  const prof = professions.find((p) => p.id === profession);
  const canNext =
    (step === 'locale' && !!locale) ||
    (step === 'profession' && !!profession) ||
    step === 'industry' ||
    (step === 'level' && !!level) ||
    step === 'focus' ||
    (step === 'goal' && !!goal);

  const finish = async () => {
    if (!profession || !level || !goal) return;
    await savePrefs({ focus });
    await saveProfile({ profession, industry, level, goal, locale, createdAt: Date.now() });
  };

  const next = () => (index === steps.length - 1 ? void finish() : setIndex(index + 1));

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <span className="bg-primary text-primary-ink flex size-11 items-center justify-center rounded-xl">
          <Icon name="bridge" className="size-7" />
        </span>
        <div>
          <p className="text-xl font-semibold">{t('app.name')}</p>
          <p className="text-muted text-sm">{t('app.tagline')}</p>
        </div>
      </div>

      <ol
        className="mb-6 flex gap-1.5"
        aria-label={t('onboarding.progress', { step: index + 1, total: steps.length })}
      >
        {steps.map((s, i) => (
          <li
            key={s}
            className={cx('h-1.5 flex-1 rounded-full', i <= index ? 'bg-primary' : 'bg-line')}
            aria-current={i === index ? 'step' : undefined}
          />
        ))}
      </ol>

      <form
        className="flex flex-1 flex-col"
        aria-labelledby={headingId}
        onSubmit={(e) => {
          e.preventDefault();
          if (canNext) next();
        }}
      >
        <fieldset className="flex flex-col gap-3">
          <legend id={headingId} className="mb-1 text-2xl font-semibold tracking-tight">
            {t(`onboarding.${step}.title` as const)}
          </legend>
          <p className="text-muted mb-2">{t(`onboarding.${step}.hint` as const)}</p>

          {step === 'locale' &&
            locales.map((l) => (
              <Option
                key={l.code}
                name="locale"
                value={l.code}
                selected={locale === l.code}
                onSelect={() => setLocale(l.code)}
                title={l.name}
              />
            ))}

          {step === 'profession' &&
            professions.map((p) => (
              <Option
                key={p.id}
                name="profession"
                value={p.id}
                selected={profession === p.id}
                onSelect={() => {
                  setProfession(p.id);
                  setIndustry(null);
                }}
                title={pick(p.tr)?.name ?? p.de}
                description={<span lang="de">{p.de}</span>}
              />
            ))}

          {step === 'industry' && (
            <>
              {prof?.industries.map((i) => (
                <Option
                  key={i.id}
                  name="industry"
                  value={i.id}
                  selected={industry === i.id}
                  onSelect={() => setIndustry(i.id)}
                  title={pick(i.tr)}
                />
              ))}
              <Option
                name="industry"
                value=""
                selected={industry === null}
                onSelect={() => setIndustry(null)}
                title={t('onboarding.industry.none')}
              />
            </>
          )}

          {step === 'level' &&
            LEVELS.map((l) => (
              <Option
                key={l}
                name="level"
                value={l}
                selected={level === l}
                onSelect={() => setLevel(l)}
                title={<span className="font-mono">{l}</span>}
                description={t(`level.${l}` as const)}
              />
            ))}

          {step === 'focus' &&
            (['de', 'locale'] as const).map((f) => (
              <Option
                key={f}
                name="focus"
                value={f}
                selected={focus === f}
                onSelect={() => setFocus(f)}
                title={t(`focus.${f}` as const)}
                description={t(`focus.${f}.hint` as const)}
              />
            ))}

          {step === 'goal' &&
            GOALS.map((g) => (
              <Option
                key={g}
                name="goal"
                value={g}
                selected={goal === g}
                onSelect={() => setGoal(g)}
                title={t(`goal.${g}` as const)}
                description={t(`goal.${g}.hint` as const)}
              />
            ))}
        </fieldset>

        <p className="bg-surface-2 text-muted mt-6 flex items-start gap-2 rounded-lg p-3 text-sm">
          <Icon name="check" className="text-good mt-0.5 size-4 shrink-0" />
          {t('onboarding.privacy')}
        </p>

        <div className="bg-bg sticky bottom-0 mt-auto flex gap-3 pt-6 pb-2">
          {index > 0 && (
            <Button onClick={() => setIndex(index - 1)} className="flex-1">
              {t('common.back')}
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={!canNext} className="flex-[2]">
            {index === steps.length - 1 ? t('onboarding.start') : t('common.next')}
          </Button>
        </div>
      </form>
    </main>
  );
}
