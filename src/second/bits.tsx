import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/content/locale';
import { Icon } from '@/components/Icon';
import { Button, Panel, Spinner } from '@/components/ui';
import { speak, speechSupported } from '@/lib/speech';
import { cx } from '@/lib/cx';
import { ESCO_API_URL, toId } from './esco/config';
import { langDir, type EscoLang } from './esco/languages';
import type { Ref } from './esco/types';
import type { Async } from './useAsync';

/** Código do idioma em destaque, ex.: DE */
export function LangTag({ lang, className }: { lang: EscoLang; className?: string }) {
  return (
    <span
      className={cx(
        'border-line-strong text-muted inline-block rounded border px-1 font-mono text-[0.6875rem] leading-4 uppercase',
        className,
      )}
    >
      {lang}
    </span>
  );
}

/** Texto num idioma da ESCO, com lang/dir corretos. Vazio vira um aviso discreto. */
export function LangText({
  lang,
  text,
  className,
}: {
  lang: EscoLang;
  text: string | undefined;
  className?: string;
}) {
  const { t } = useI18n();
  if (!text) return <span className="text-muted italic">{t('esco.occ.noText')}</span>;
  return (
    <span lang={lang} dir={langDir(lang)} className={cx('[overflow-wrap:anywhere]', className)}>
      {/* rótulos da ESCO trazem as duas formas: "Koch/Köchin"; deixa quebrar depois da barra */}
      {text.replace(/\//g, '/\u200B')}
    </span>
  );
}

export function SpeakButton({ text, lang }: { text: string | undefined; lang: EscoLang }) {
  const { t } = useI18n();
  if (!text || !speechSupported()) return null;
  return (
    <button
      type="button"
      onClick={() => speak(text, lang)}
      className="text-muted hover:text-primary hover:bg-surface-2 inline-flex size-9 shrink-0 items-center justify-center rounded-lg"
      aria-label={t('term.listen', { word: text })}
    >
      <Icon name="speaker" className="size-5" />
    </button>
  );
}

/** Mostra estado de carregamento/erro de um pedido à ESCO; renderiza `children` com os dados. */
export function AsyncView<T>({
  state,
  children,
}: {
  state: Async<T>;
  children: (data: T) => ReactNode;
}) {
  const { t } = useI18n();
  if (state.status === 'loading') return <Spinner label={t('esco.loading')} />;
  if (state.status === 'error')
    return (
      <Panel role="alert" className="border-bad/50 bg-bad-soft p-5">
        <p className="font-semibold">{t('esco.error')}</p>
        <p className="text-muted mt-1 text-sm break-all">
          {t('esco.errorHint', { url: ESCO_API_URL })}
        </p>
        <Button className="mt-3" onClick={state.retry}>
          {t('esco.retry')}
        </Button>
      </Panel>
    );
  return <>{children(state.data)}</>;
}

export function RefLinks({ refs, kind }: { refs: Ref[]; kind: 'o' | 's' }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {refs.map((r) => (
        <li key={r.uri}>
          <Link
            to={`/second/${kind}/${toId(r.uri)}`}
            className="border-line-strong bg-surface hover:bg-surface-2 inline-flex min-h-9 items-center rounded-full border px-3 text-sm"
          >
            {r.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PortalLink({ uri }: { uri: string }) {
  const { t } = useI18n();
  return (
    <p className="text-muted mt-8 text-xs">
      {t('esco.source')} ·{' '}
      <a
        href={uri}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline underline-offset-2"
      >
        {t('esco.openPortal')}
        <span className="sr-only"> {t('common.newTab')}</span>
      </a>
    </p>
  );
}
