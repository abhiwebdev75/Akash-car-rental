import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/cn';

/**
 * Light/dark switch. Reads + writes the shared ThemeContext, which persists the
 * manual choice to localStorage (and otherwise follows the OS setting).
 * Icon crossfades between sun/moon.
 */
export function ThemeToggle({ className }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-fg transition-colors hover:bg-ink-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/50 dark:hover:bg-white/5',
        className
      )}
    >
      <Sun
        className={cn(
          'absolute h-5 w-5 transition-all duration-300',
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        )}
      />
      <Moon
        className={cn(
          'absolute h-5 w-5 transition-all duration-300',
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        )}
      />
    </button>
  );
}
