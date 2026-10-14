import { useRegisterSW } from 'virtual:pwa-register/react';
import { useI18n } from '@/content/locale';
import { Button } from '@/components/ui';

/** Avisa quando há uma versão nova do app (conteúdo ou código) pronta para usar. */
export function UpdatePrompt() {
  const { t } = useI18n();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div
      role="status"
      className="border-line bg-surface fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border p-3 shadow-lg md:bottom-6"
    >
      <p className="flex-1 text-sm">{t('pwa.update')}</p>
      <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
        {t('common.later')}
      </Button>
      <Button size="sm" variant="primary" onClick={() => void updateServiceWorker(true)}>
        {t('pwa.reload')}
      </Button>
    </div>
  );
}
