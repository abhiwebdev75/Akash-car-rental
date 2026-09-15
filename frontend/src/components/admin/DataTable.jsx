import { cn } from '../../lib/cn';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };

/**
 * Lightweight, theme-aware data table for admin lists.
 *
 * columns: [{ key, header, render?(row), align?, className?, headerClassName?, hideOnMobile? }]
 *   - render(row) returns the cell node; falls back to row[key].
 * rows:      array of records
 * keyField:  unique row key (default '_id')
 * loading:   shows shimmer rows
 * empty:     EmptyState props ({ icon, title, description, action }) shown when no rows
 * onRowClick(row): makes rows interactive (keyboard + pointer)
 */
export function DataTable({
  columns,
  rows = [],
  keyField = '_id',
  loading = false,
  skeletonRows = 6,
  empty,
  onRowClick,
  className,
}) {
  const showEmpty = !loading && rows.length === 0;

  return (
    <div className={cn('overflow-hidden rounded-xl border border-hair bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hair bg-surface/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted',
                    ALIGN[col.align] || ALIGN.left,
                    col.hideOnMobile && 'hidden md:table-cell',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hair">
            {loading &&
              Array.from({ length: skeletonRows }).map((_, r) => (
                <tr key={`sk-${r}`}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3.5', col.hideOnMobile && 'hidden md:table-cell')}
                    >
                      <Skeleton className="h-4 w-full max-w-[8rem]" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading &&
              rows.map((row) => {
                const clickable = typeof onRowClick === 'function';
                return (
                  <tr
                    key={row[keyField]}
                    onClick={clickable ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      clickable
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    tabIndex={clickable ? 0 : undefined}
                    role={clickable ? 'button' : undefined}
                    className={cn(
                      'transition-colors',
                      clickable &&
                        'cursor-pointer hover:bg-ink-900/[0.03] focus:bg-ink-900/[0.04] focus:outline-none dark:hover:bg-white/[0.03] dark:focus:bg-white/[0.04]'
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3.5 text-fg align-middle',
                          ALIGN[col.align] || ALIGN.left,
                          col.hideOnMobile && 'hidden md:table-cell',
                          col.className
                        )}
                      >
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showEmpty && (
        <EmptyState
          className="rounded-none border-0 bg-transparent"
          icon={empty?.icon}
          title={empty?.title || 'Nothing to show'}
          description={empty?.description}
          action={empty?.action}
        />
      )}
    </div>
  );
}
