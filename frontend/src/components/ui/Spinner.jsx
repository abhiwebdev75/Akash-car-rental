import { cn } from '../../lib/cn';

// Inherits currentColor, so it takes the colour of whatever it sits inside.
export function Spinner({ className, label = 'Loading' }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em]',
        className || 'h-5 w-5'
      )}
    />
  );
}
