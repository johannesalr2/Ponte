import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useActiveProfile } from '@/app/profile';
import { useI18n } from '@/content/locale';
import {
  findTerm,
  loadAllProfessions,
  useLoadedTerms,
  useProfessionContent,
} from '@/content/loader';
import { Icon } from '@/components/Icon';
import { TermDetail } from '@/components/TermDetail';
import { Spinner } from '@/components/ui';

export default function TermPage() {
  const { termId = '' } = useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const profile = useActiveProfile();
  useProfessionContent(profile.profession);
  const [searched, setSearched] = useState(false);
  const term = useLoadedTerms([termId]).get(termId);
  const related = useLoadedTerms(term?.related ?? []);

  // termo de outra profissão: carrega todas
  useEffect(() => {
    if (term || searched) return;
    void loadAllProfessions().then(() => setSearched(true));
  }, [term, searched]);

  useEffect(() => {
    if (term) document.title = `${term.de.word} · ${t('app.name')}`;
    return () => {
      document.title = t('app.name');
    };
  }, [term, t]);

  if (!term) {
    if (searched && !findTerm(termId)) {
      return (
        <p className="p-6">
          {t('term.notFound')}{' '}
          <Link to="/glossary" className="text-primary underline">
            {t('nav.glossary')}
          </Link>
        </p>
      );
    }
    return <Spinner label={t('common.loading')} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/glossary'))}
        className="text-primary mb-3 inline-flex min-h-10 items-center gap-1 rounded-lg pr-3 hover:underline"
      >
        <Icon name="back" /> {t('common.back')}
      </button>
      <TermDetail
        term={term}
        related={term.related.map((id) => related.get(id)).filter((x) => x !== undefined)}
      />
    </>
  );
}
