import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

// The amber "signal" is reserved for the single primary action on a view.
// Everything else stays quieter so the CTA reads as the way forward.
const VARIANTS = {
  primary:
    'bg-signal text-ink-900 hover:bg-signal-600 hover:shadow-signal focus-visible:ring-signal',
  solid:
    'bg-ink-800 text-white hover:bg-ink-700 focus-visible:ring-ink-500 dark:bg-ink-700 dark:hover:bg-ink-600',
  secondary:
    'border border-hair bg-surface text-fg-strong hover:border-ink-300 hover:bg-paper focus-visible:ring-ink-400 dark:hover:border-ink-400',
  ghost:
    'text-fg hover:bg-ink-900/5 focus-visible:ring-ink-400 dark:hover:bg-white/5',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
};

const SIZES = {
  sm: 'h-9 gap-1.5 px-3.5 text-sm',
  md: 'h-11 gap-2 px-5 text-sm',
  lg: 'h-12 gap-2.5 px-7 text-base',
};

const BASE =
  'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-paper ' +
  'disabled:pointer-events-none disabled:opacity-60 select-none whitespace-nowrap';

/**
 * Polymorphic button: renders a <button> by default, a react-router <Link> when
 * `to` is set, or an <a> when `href` is set. Handles loading + icon slots.
 */
export const Button = forwardRef(function Button(
  {
    to,
    href,
    variant = 'primary',
    size = 'md',
    className,
    loading = false,
    disabled,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children,
    ...props
  },
  ref
) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);
  const content = (
    <>
      {loading && <Spinner className="h-4 w-4" />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
});
