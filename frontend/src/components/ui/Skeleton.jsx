import { cn } from '../../lib/cn';

/**
 * Shimmer placeholder block. Compose several to mirror the shape of content
 * being loaded (see VehicleCardSkeleton etc. in feature folders).
 */
export function Skeleton({ className }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-ink-900/8 dark:bg-white/8', className)}
      aria-hidden="true"
    />
  );
}

/** A few stacked text lines; `lines` controls how many. Last line is shorter. */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}
