import { useRef } from 'react';
import { useI18n } from '@/content/locale';
import { mediaUrl } from '@/content/loader';
import type { Term } from '@/content/schema';
import { cx } from '@/lib/cx';
import { Icon } from './Icon';

/**
 * Imagem do objeto com crédito e licença. Só aparece se o termo tiver `image`.
 * Um toque abre a imagem em tela cheia, com rolagem para ver detalhes.
 */
export function TermImage({ term }: { term: Term }) {
  const { t, pick } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const img = term.image;
  const src = img ? mediaUrl(img.file) : undefined;
  if (!img || !src) return null;
  const alt = pick(img.alt) ?? term.de.word;
  return (
    <figure className="border-line border-t">
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="group relative block w-full bg-white p-3"
        aria-label={t('term.imageZoom')}
      >
        <img
          src={src}
          alt={alt}
          decoding="async"
          className="mx-auto block h-auto max-h-96 w-full object-contain"
        />
        <span className="bg-surface/90 text-ink absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs shadow-sm">
          <Icon name="search" className="size-3.5" /> {t('term.imageZoom')}
        </span>
      </button>
      <figcaption className="text-muted border-line border-t px-5 py-2 text-xs">
        {t('term.photoCredit', { author: img.author, license: img.license })} ·{' '}
        <a
          href={img.source}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline underline-offset-2"
        >
          {t('term.photoSource')}
          <span className="sr-only"> {t('common.newTab')}</span>
        </a>
      </figcaption>
      <dialog
        ref={dialog}
        aria-label={alt}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-white p-0 backdrop:bg-black/60"
      >
        <div className="flex h-full flex-col">
          <div className="border-line flex items-center justify-between border-b px-4 py-2">
            <span lang="de" className="font-semibold text-[#22303a]">
              {term.de.article ? `${term.de.article} ` : ''}
              {term.de.word}
            </span>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-[#22303a] hover:bg-black/5"
            >
              <Icon name="x" /> {t('common.close')}
            </button>
          </div>
          {/* imagem larga: rola na horizontal no celular para ler as legendas */}
          <div className="flex-1 overflow-auto">
            <img src={src} alt={alt} className="block h-auto w-[max(100%,900px)] max-w-none p-4" />
          </div>
        </div>
      </dialog>
    </figure>
  );
}

/** Miniatura decorativa para listas (o texto do card já nomeia o objeto). */
export function TermThumb({ term, className }: { term: Term; className?: string }) {
  const src = term.image ? mediaUrl(term.image.file) : undefined;
  if (!src) return null;
  return (
    <span
      className={cx(
        'border-line flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white p-1',
        className,
      )}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className="max-h-full max-w-full object-contain"
      />
    </span>
  );
}
