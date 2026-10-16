import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useI18n } from '@/content/locale';
import { Spinner } from '@/components/ui';
import { EscoLayout } from './Layout';
import LanguagesPage from './LanguagesPage';
import { useLangPair } from './prefs';

const SearchPage = lazy(() => import('./SearchPage'));
const OccupationPage = lazy(() => import('./OccupationPage'));
const SkillPage = lazy(() => import('./SkillPage'));
const PracticePage = lazy(() => import('./PracticePage'));

function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.getElementById('main')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Área experimental /second: profissões e habilidades vindas da ESCO, em
 * qualquer par de idiomas europeus. Independe do perfil do app principal.
 */
export default function SecondApp() {
  const { t } = useI18n();
  const [pair, savePair] = useLangPair();
  const languages = <LanguagesPage pair={pair} onSave={savePair} />;

  return (
    <BrowserRouter>
      <RouteFocus />
      <EscoLayout pair={pair}>
        <Suspense fallback={<Spinner label={t('common.loading')} />}>
          {!pair ? (
            languages
          ) : (
            <Routes>
              <Route path="/second" element={<SearchPage pair={pair} />} />
              <Route path="/second/idiomas" element={languages} />
              <Route path="/second/o/:id" element={<OccupationPage pair={pair} />} />
              <Route path="/second/o/:id/praticar" element={<PracticePage pair={pair} />} />
              <Route path="/second/s/:id" element={<SkillPage pair={pair} />} />
              <Route path="*" element={<Navigate to="/second" replace />} />
            </Routes>
          )}
        </Suspense>
      </EscoLayout>
    </BrowserRouter>
  );
}
