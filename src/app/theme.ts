import { useEffect } from 'react';
import type { ThemePref } from '@/db/types';

/** Aplica o tema em <html data-theme>, seguindo o sistema quando "system". */
export function useTheme(pref: ThemePref) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = pref === 'dark' || (pref === 'system' && mq.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#15202a' : '#0b4f6c');
    };
    apply();
    try {
      localStorage.setItem('ponte-theme', pref);
    } catch {
      // armazenamento indisponível: o tema só não é lembrado antes da 1ª pintura
    }
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pref]);
}
