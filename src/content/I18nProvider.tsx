import { useMemo, type ReactNode } from 'react';
import { createI18n, I18nContext } from './locale';

export function I18nProvider({ code, children }: { code: string; children: ReactNode }) {
  const value = useMemo(() => createI18n(code), [code]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
