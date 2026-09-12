import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

/**
 * Standard error panel for failed queries. `error` may be a string or the
 * normalized error object from extractApiError ({message}). `onRetry` shows a
 * retry button (wire to query.refetch()).
 */
export function ErrorState({ title = 'Something went wrong', error, onRetry, className }) {
  const message = typeof error === 'string' ? error : error?.message;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-red-500/30 bg-red-500/5 px-6 py-12 text-center',
        className
      )}
      role="alert"
    >
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h3 className="text-base font-semibold text-fg-strong">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
