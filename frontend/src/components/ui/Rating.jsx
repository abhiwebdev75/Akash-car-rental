import { Star } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Star rating. Read-only by default (display a value); pass `onChange` to make
 * it an interactive input (used in the review form). Renders half-stars for
 * fractional read-only values via an overlay clip.
 */
export function Rating({ value = 0, count, onChange, size = 'md', className, showValue = false }) {
  const interactive = typeof onChange === 'function';
  const px = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div
        className="inline-flex items-center gap-0.5"
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={interactive ? 'Rating' : `Rated ${value} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.max(0, Math.min(1, value - (star - 1))); // 0..1 for this star
          if (interactive) {
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={star === Math.round(value)}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                onClick={() => onChange(star)}
                className="rounded p-0.5 text-signal transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/50"
              >
                <Star
                  className={cn(px, star <= value ? 'fill-current' : 'fill-transparent text-ink-300 dark:text-ink-500')}
                />
              </button>
            );
          }
          return (
            <span key={star} className="relative inline-block">
              <Star className={cn(px, 'fill-transparent text-ink-200 dark:text-ink-600')} />
              <span
                className="absolute inset-0 overflow-hidden text-signal"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className={cn(px, 'fill-current')} />
              </span>
            </span>
          );
        })}
      </div>
      {showValue && value > 0 && (
        <span className="text-sm font-semibold text-fg-strong">{Number(value).toFixed(1)}</span>
      )}
      {typeof count === 'number' && (
        <span className="text-sm text-muted">
          ({count})
        </span>
      )}
    </div>
  );
}
