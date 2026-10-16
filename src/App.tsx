import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DEFAULT_LOCALE } from '@/content/config';
import { I18nProvider } from '@/content/I18nProvider';
import { useI18n } from '@/content/locale';
import { usePrefs, useProfile } from '@/db/hooks';
import { Layout } from '@/components/Layout';
import { Spinner } from '@/components/ui';
import { ProfileContext } from '@/app/profile';
import { useTheme } from '@/app/theme';
import { UpdatePrompt } from '@/app/UpdatePrompt';

const Onboarding = lazy(() => import('@/features/onboarding/Onboarding'));
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'));
const Glossary = lazy(() => import('@/features/glossary/Glossary'));
const TermPage = lazy(() => import('@/features/glossary/TermPage'));
const Review = lazy(() => import('@/features/review/Review'));
const Practice = lazy(() => import('@/features/exercises/Practice'));
const Situations = lazy(() => import('@/features/situations/Situations'));
const SituationPage = lazy(() => import('@/features/situations/SituationPage'));
const Career = lazy(() => import('@/features/career/Career'));
const Settings = lazy(() => import('@/features/settings/Settings'));
const SecondApp = lazy(() => import('@/second/SecondApp'));

/** /second é uma área separada (dados da ESCO), sem onboarding nem perfil. */
const isSecond = () => /^\/second(\/|$)/.test(window.location.pathname);

/** Ajusta lang/dir do documento ao idioma de explicação. */
function DocumentLocale() {
  const { locale } = useI18n();
  useEffect(() => {
    document.documentElement.lang = locale.code;
    document.documentElement.dir = locale.dir;
  }, [locale]);
  return null;
}

/** Leva o foco ao conteúdo e o título da página a cada navegação (leitores de tela). */
function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.getElementById('main')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Loading() {
  const { t } = useI18n();
  return <Spinner label={t('common.loading')} />;
}

export default function App() {
  const profile = useProfile();
  const prefs = usePrefs();
  useTheme(prefs.theme);

  if (isSecond())
    return (
      <I18nProvider code={DEFAULT_LOCALE}>
        <DocumentLocale />
        <Suspense fallback={null}>
          <SecondApp />
        </Suspense>
      </I18nProvider>
    );
  if (profile === undefined) return null; // IndexedDB abrindo (alguns ms)

  return (
    <I18nProvider code={profile?.locale ?? DEFAULT_LOCALE}>
      <DocumentLocale />
      {profile === null ? (
        <Suspense fallback={null}>
          <Onboarding />
        </Suspense>
      ) : (
        <ProfileContext.Provider value={profile}>
          <BrowserRouter>
            <RouteFocus />
            <Layout>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/glossary" element={<Glossary />} />
                  <Route path="/glossary/:termId" element={<TermPage />} />
                  <Route path="/review" element={<Review />} />
                  <Route path="/practice" element={<Practice />} />
                  <Route path="/situations" element={<Situations />} />
                  <Route path="/situations/:id" element={<SituationPage />} />
                  <Route path="/career" element={<Career />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Layout>
          </BrowserRouter>
        </ProfileContext.Provider>
      )}
      <UpdatePrompt />
    </I18nProvider>
  );
}
