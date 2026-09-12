import { cn } from '../../lib/cn';

/**
 * Friendly "nothing here" panel. `icon` is a lucide icon component (not element)
 * so we control sizing. `action` is an optional CTA node.
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-hair bg-surface/60 px-6 py-14 text-center',
        className
      )}
    >
      {Icon && (
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-900/5 text-muted dark:bg-white/5">
          <Icon className="h-6 w-6" />
        </span>
      )}
      {title && <h3 className="text-base font-semibold text-fg-strong">{title}</h3>}
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
