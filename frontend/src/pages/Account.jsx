import { useMemo } from 'react';
import { CalendarClock, CircleAlert, Plus, UserRound } from 'lucide-react';
import { useMyBookings } from '../features/bookings/hooks';
import { useSettings } from '../features/settings/hooks';
import { useAuth } from '../context/AuthContext';
import { BookingCard } from '../features/bookings/BookingCard';
import { Button, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { ROUTES, BOOKING_STATUS } from '../lib/constants';
import { formatMoney } from '../lib/formatters';

const CURRENT = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE];

export default function Account() {
  const { user } = useAuth();
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';
  const { data, isLoading, isError, error, refetch } = useMyBookings({ limit: 100, sort: '-createdAt' });

  const items = data?.items || [];

  const { current, past, balanceDue } = useMemo(() => {
    const cur = [];
    const old = [];
    let due = 0;
    for (const b of items) {
      if (CURRENT.includes(b.status)) {
        cur.push(b);
        if (b.status !== BOOKING_STATUS.CANCELLED) due += b.amountRemaining || 0;
      } else {
        old.push(b);
      }
    }
    // Soonest pickup first for what's coming up; most recent first for history.
    cur.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    old.sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
    return { current: cur, past: old, balanceDue: due };
  }, [items]);

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg-strong sm:text-3xl">My bookings</h1>
          {user?.name && <p className="mt-1 text-muted">Welcome back, {user.name.split(' ')[0]}.</p>}
        </div>
        <div className="flex gap-2">
          <Button to={ROUTES.profile} variant="secondary" leftIcon={<UserRound className="h-4 w-4" />}>
            Profile
          </Button>
          <Button to={ROUTES.cars} leftIcon={<Plus className="h-4 w-4" />}>
            Book a car
          </Button>
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <div className="mt-8">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={CalendarClock}
            title="No bookings yet"
            description="When you book a car, it’ll show up here so you can track and manage it."
            action={<Button to={ROUTES.cars}>Browse cars</Button>}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {balanceDue > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-signal-300/60 bg-signal-50 p-4 dark:border-signal-700/40 dark:bg-signal-900/15">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-signal-700 dark:text-signal-400" />
              <div className="text-sm">
                <p className="font-semibold text-fg-strong">
                  Balance due: {formatMoney(balanceDue, currency)}
                </p>
                <p className="mt-0.5 text-muted">
                  Outstanding across your active bookings — payable at pickup unless already settled.
                </p>
              </div>
            </div>
          )}

          {current.length > 0 && (
            <Section title="Current & upcoming" count={current.length}>
              {current.map((b) => (
                <BookingCard key={b._id} booking={b} currency={currency} />
              ))}
            </Section>
          )}

          {past.length > 0 && (
            <Section title="Past" count={past.length}>
              {past.map((b) => (
                <BookingCard key={b._id} booking={b} currency={currency} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, count, children }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        {title} <span className="text-muted/70">({count})</span>
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-8 space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}
