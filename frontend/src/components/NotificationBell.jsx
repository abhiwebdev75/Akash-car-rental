import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import {
  useUnreadCount,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../features/notifications/hooks';
import { ROUTES, NOTIFICATION_AUDIENCE, NOTIFICATION_TYPE_META } from '../lib/constants';
import { cn } from '../lib/cn';

// Tailwind accent classes per tone (the little dot beside each item).
const DOT_TONE = {
  success: 'bg-emerald-500',
  info: 'bg-sky-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  muted: 'bg-muted',
};

// Compact "3m ago" / "2h ago" / "5d ago" relative time. Falls back to a date
// once things are older than a week.
function timeAgo(input) {
  if (!input) return '';
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(then).toLocaleDateString();
}

/**
 * Map a notification to the screen it should open. Admin-audience items point
 * at the business console; customer items point at the account area. Anything
 * we can't resolve just closes the dropdown (no navigation).
 */
function resolveTarget(n) {
  const data = n.data || {};
  const isAdmin = n.audience === NOTIFICATION_AUDIENCE.ADMIN;
  if (data.bookingId) {
    return isAdmin ? ROUTES.adminBooking(data.bookingId) : ROUTES.accountBooking(data.bookingId);
  }
  if (isAdmin && data.vehicleId) return ROUTES.adminFleet;
  return null;
}

/**
 * Notification bell + dropdown inbox. Shared by the admin header and the
 * customer navbar — the audience field on each item drives deep-links, so one
 * component serves both. The unread badge polls; the list loads lazily when the
 * dropdown opens.
 */
export function NotificationBell({ align = 'right' }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unreadQ = useUnreadCount();
  const unread = unreadQ.data ?? 0;

  const listQ = useNotifications({ limit: 12 }, { enabled: open });
  const items = listQ.data?.items || [];

  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  // Close on outside click.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleItemClick = (n) => {
    if (!n.readAt) markRead.mutate(n._id);
    const target = resolveTarget(n);
    setOpen(false);
    if (target) navigate(target);
  };

  const badge = unread > 9 ? '9+' : String(unread);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-fg transition-colors hover:bg-ink-900/5 dark:hover:bg-white/5"
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 inline-flex min-w-[1.05rem] items-center justify-center rounded-full bg-signal px-1 text-[10px] font-bold leading-none text-ink-900">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-hair bg-card shadow-pop animate-scale-in',
            align === 'left' ? 'left-0' : 'right-0'
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-hair px-4 py-3">
            <h3 className="text-sm font-semibold text-fg-strong">Notifications</h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-fg-strong disabled:opacity-50"
              >
                {markAll.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {listQ.isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto mb-2 h-6 w-6 text-muted" />
                <p className="text-sm text-muted">You're all caught up.</p>
              </div>
            ) : (
              <ul className="divide-y divide-hair">
                {items.map((n) => {
                  const meta = NOTIFICATION_TYPE_META[n.type] || {};
                  const target = resolveTarget(n);
                  return (
                    <li key={n._id}>
                      <button
                        type="button"
                        onClick={() => handleItemClick(n)}
                        className={cn(
                          'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-900/5 dark:hover:bg-white/5',
                          !n.readAt && 'bg-signal/5'
                        )}
                      >
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            n.readAt ? 'bg-transparent' : DOT_TONE[meta.tone] || 'bg-signal'
                          )}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                'truncate text-sm',
                                n.readAt ? 'font-medium text-fg' : 'font-semibold text-fg-strong'
                              )}
                            >
                              {n.title || meta.label || 'Notification'}
                            </span>
                            <span className="shrink-0 text-[11px] text-muted">{timeAgo(n.createdAt)}</span>
                          </span>
                          {n.body && <span className="mt-0.5 block text-xs text-muted line-clamp-2">{n.body}</span>}
                          {target && (
                            <span className="mt-1 inline-block text-[11px] font-medium text-signal">View details</span>
                          )}
                        </span>
                        {!n.readAt && (
                          <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-muted opacity-0 group-hover:opacity-100" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
