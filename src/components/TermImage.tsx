import { useI18n } from '@/content/locale';
import { mediaUrl } from '@/content/loader';
import type { Term } from '@/content/schema';
import { cx } from '@/lib/cx';

/** Foto do objeto com crédito e licença. Só aparece se o termo tiver `image`. */
export function TermImage({ term }: { term: Term }) {
  const { t, pick } = useI18n();
  const img = term.image;
  const src = img ? mediaUrl(img.file) : undefined;
  if (!img || !src) return null;
  return (
    <figure className="border-line border-t">
      <div className="flex aspect-[4/3] max-h-80 w-full items-center justify-center bg-white p-3">
        <img
          src={src}
          alt={pick(img.alt) ?? term.de.word}
          loading="lazy"
          decoding="async"
          className="max-h-full max-w-full object-contain"
        />
      </div>
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
        'border-line flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white',
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
