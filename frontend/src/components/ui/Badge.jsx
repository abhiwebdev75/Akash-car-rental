import { cn } from '../../lib/cn';

// Tone-based chips. Kept subtle (tinted bg + readable text) in both themes.
const TONES = {
  neutral: 'bg-ink-900/8 text-ink-700 dark:bg-white/10 dark:text-ink-100',
  info: 'bg-blue-500/12 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  success: 'bg-route/15 text-route-700 dark:bg-route/20 dark:text-route-300',
  warning: 'bg-signal/18 text-signal-800 dark:bg-signal/20 dark:text-signal-300',
  danger: 'bg-red-500/12 text-red-700 dark:bg-red-400/15 dark:text-red-300',
  muted: 'bg-ink-900/5 text-muted dark:bg-white/5',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ tone = 'neutral', size = 'md', className, dot = false, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold leading-none tracking-wide',
        TONES[tone] || TONES.neutral,
        SIZES[size],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
