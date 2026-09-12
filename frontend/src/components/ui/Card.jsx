import { cn } from '../../lib/cn';

/**
 * Surface container. `as` lets it be a Link/article/etc.
 * `interactive` adds hover lift for clickable cards.
 */
export function Card({ as: Tag = 'div', className, interactive = false, children, ...props }) {
  return (
    <Tag
      className={cn(
        'rounded-xl border border-hair bg-card',
        interactive &&
          'transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-card dark:hover:border-ink-500',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('border-b border-hair px-5 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('border-t border-hair px-5 py-4', className)} {...props}>
      {children}
    </div>
  );
}
