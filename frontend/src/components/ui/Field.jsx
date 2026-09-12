import { cn } from '../../lib/cn';

// Shared control styling so text inputs, selects and textareas match exactly.
export const CONTROL_BASE =
  'w-full rounded-lg border bg-surface px-3.5 text-sm text-fg-strong placeholder:text-muted ' +
  'transition-colors focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Label + control + hint/error shell. Inputs compose this so every form field
 * is consistent and accessible (label tied to control, error announced).
 */
export function Field({ label, hint, error, required, htmlFor, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-fg-strong">
          {label}
          {required && <span className="text-signal-700 dark:text-signal-400"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
