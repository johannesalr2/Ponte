import { Link, useSearchParams } from 'react-router-dom';
import { useActiveProfile } from '@/app/profile';
import { useI18n } from '@/content/locale';
import { professions, useProfessionContent } from '@/content/loader';
import { Icon } from '@/components/Icon';
import { LevelBadge } from '@/components/term-bits';
import { PageHeader, Spinner } from '@/components/ui';

export default function Situations() {
  const profile = useActiveProfile();
  const { t, pick } = useI18n();
  const [params, setParams] = useSearchParams();
  const professionId = params.get('prof') ?? profile.profession;
  const content = useProfessionContent(professionId);

  return (
    <>
      <PageHeader kicker={t('situations.kicker')} title={t('situations.title')}>
        <label>
          <span className="sr-only">{t('glossary.profession')}</span>
          <select
            value={professionId}
            onChange={(e) =>
              setParams(e.target.value === profile.profession ? {} : { prof: e.target.value }, {
                replace: true,
              })
            }
            className="border-line-strong bg-surface min-h-11 rounded-lg border px-3"
          >
            {professions.map((p) => (
              <option key={p.id} value={p.id}>
                {pick(p.tr)?.name ?? p.de}
              </option>
            ))}
          </select>
        </label>
      </PageHeader>
      <p className="text-muted mb-4 max-w-2xl">{t('situations.intro')}</p>
      {!content ? (
        <Spinner label={t('common.loading')} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {content.situations.map((s) => {
            const tr = pick(s.tr);
            return (
              <li key={s.id}>
                <Link
                  to={`/situations/${s.id}?prof=${professionId}`}
                  className="border-line bg-surface hover:border-primary flex h-full flex-col gap-2 rounded-xl border p-5"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-lg font-semibold">
                      <Icon name="chat" className="text-primary size-5" />
                      {tr?.title}
                    </span>
                    <LevelBadge level={s.level} />
                  </span>
                  <span className="text-muted">{tr?.context}</span>
                  <span className="text-muted mt-auto text-sm">
                    {t('situations.lines', { count: s.lines.length })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
