import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

// Builds a compact page list with ellipses: 1 … 4 5 [6] 7 8 … 20
function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

/**
 * Pagination driven by backend meta ({page, totalPages}). Calls onPageChange
 * with the next page number. Hidden when there's a single page.
 */
export function Pagination({ page, totalPages, onPageChange, className }) {
  if (!totalPages || totalPages <= 1) return null;
  const pages = buildPages(page, totalPages);

  const btn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="Pagination">
      <button
        type="button"
        className={cn(btn, 'text-fg hover:bg-ink-900/5 dark:hover:bg-white/5')}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1.5 text-sm text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              btn,
              p === page
                ? 'bg-ink-800 text-white dark:bg-ink-600'
                : 'text-fg hover:bg-ink-900/5 dark:hover:bg-white/5'
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        className={cn(btn, 'text-fg hover:bg-ink-900/5 dark:hover:bg-white/5')}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
