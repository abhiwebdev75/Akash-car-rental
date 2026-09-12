import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';
import { ROUTES } from '../lib/constants';

/**
 * Brand mark: a small "route" glyph (two stops joined by a path) that nods to
 * the journey concept, plus the wordmark. `name` comes from Settings so the
 * business name isn't hardcoded; falls back gracefully before settings load.
 */
export function Logo({ name = 'Akash', className, showWordmark = true, as = 'link' }) {
  const mark = (
    <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-white dark:bg-ink-700">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        {/* start stop */}
        <circle cx="6" cy="18" r="2.4" className="fill-signal" />
        {/* end stop */}
        <circle cx="18" cy="6" r="2.4" fill="none" className="stroke-route" strokeWidth="2" />
        {/* the route between them */}
        <path
          d="M6 15.5 C 6 9, 18 15, 18 8.5"
          className="stroke-white/70"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeDasharray="1 3"
        />
      </svg>
    </span>
  );

  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {mark}
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-bold tracking-tight text-fg-strong">
            {name}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Car Rental
          </span>
        </span>
      )}
    </span>
  );

  if (as === 'plain') return content;

  return (
    <Link to={ROUTES.home} aria-label={`${name} Car Rental — home`} className="inline-flex">
      {content}
    </Link>
  );
}
