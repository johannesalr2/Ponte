import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';

import { cx } from '@/lib/cx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-ink hover:brightness-110 border border-transparent',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2 border border-transparent',
  danger: 'bg-surface text-bad border border-bad/60 hover:bg-bad-soft',
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }
>(function Button(
  { variant = 'secondary', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[filter,background-color] disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' && 'min-h-9 px-3 text-sm',
        size === 'md' && 'min-h-11 px-4',
        size === 'lg' && 'min-h-12 px-5 text-lg',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
});

export function Panel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('border-line bg-surface rounded-xl border', className)} {...rest} />;
}

export function PageHeader({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && <p className="label-tech mb-1">{kicker}</p>}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export function Chip({
  active,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cx(
        'min-h-9 shrink-0 rounded-full border px-3 text-sm transition-colors',
        active
          ? 'border-primary bg-primary text-primary-ink'
          : 'border-line-strong bg-surface text-ink hover:bg-surface-2',
        className,
      )}
      {...rest}
    />
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="text-muted flex items-center gap-3 p-6">
      <span className="border-line-strong border-t-primary size-4 animate-spin rounded-full border-2 motion-reduce:animate-none" />
      {label}
    </div>
  );
}
