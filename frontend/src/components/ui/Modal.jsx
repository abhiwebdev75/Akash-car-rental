import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

const SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

/**
 * Accessible modal dialog. Renders in a portal, traps nothing fancy but:
 * closes on Escape and backdrop click, locks body scroll, restores focus to
 * the trigger on close, and moves focus into the panel on open.
 */
export function Modal({ open, onClose, title, description, size = 'md', children, footer }) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);

    // Focus the panel once mounted.
    const raf = requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      cancelAnimationFrame(raf);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          // Mobile: full-width bottom sheet, rounded only on top, capped at 90%
          // of the viewport height so it never runs off-screen. Desktop: a
          // centered, fully-rounded card constrained by SIZES.
          'relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-hair bg-card shadow-pop outline-none animate-scale-in',
          'sm:max-h-[85vh] sm:rounded-2xl',
          SIZES[size]
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-hair px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-fg-strong sm:text-lg">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-ink-900/5 hover:text-fg-strong dark:hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* The body scrolls; header and footer stay pinned. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-hair px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
