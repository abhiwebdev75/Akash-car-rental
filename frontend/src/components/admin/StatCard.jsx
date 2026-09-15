import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { Skeleton } from '../ui';

// Accent tints for the icon chip, keyed to a semantic tone.
const TONES = {
  neutral: 'bg-ink-900/5 text-fg dark:bg-white/5',
  signal: 'bg-signal/15 text-signal-800 dark:bg-signal/20 dark:text-signal-300',
  route: 'bg-route/15 text-route-700 dark:bg-route/20 dark:text-route-300',
  info: 'bg-blue-500/12 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  success: 'bg-route/15 text-route-700 dark:bg-route/20 dark:text-route-300',
  warning: 'bg-signal/18 text-signal-800 dark:bg-signal/20 dark:text-signal-300',
  danger: 'bg-red-500/12 text-red-700 dark:bg-red-400/15 dark:text-red-300',
};

/**
 * A single dashboard metric tile. `value` is the headline figure (already
 * formatted by the caller — money/dates come pre-computed from the backend).
 * Renders as a Link when `to` is set so tiles can deep-link into a filtered list.
 */
export function StatCard({ label, value, icon: Icon, hint, tone = 'neutral', loading = false, to }) {
  const Tag = to ? Link : 'div';
  const tagProps = to ? { to } : {};

  return (
    <Tag
      {...tagProps}
      className={cn(
        'flex items-start justify-between gap-4 rounded-xl border border-hair bg-card p-5',
        to && 'transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-card dark:hover:border-ink-500'
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-24" />
        ) : (
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-fg-strong">
            {value}
          </p>
        )}
        {hint && !loading && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
      {Icon && (
        <span
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
            TONES[tone] || TONES.neutral
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      )}
    </Tag>
  );
}
