import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Car,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCalendar } from '../../features/bookings/hooks';
import { useAdminLocations } from '../../features/locations/hooks';
import { vehicleTitle } from '../../features/vehicles/display';
import { extractApiError } from '../../lib/apiClient';
import { MANAGER_UP, ROUTES } from '../../lib/constants';
import { todayInput, addDays, combineDateTimeISO } from '../../lib/datetime';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Button, Card, CardBody, ErrorState, Select, Skeleton, StatusBadge } from '../../components/ui';

const WINDOW_DAYS = 7;

// Local yyyy-mm-dd for an ISO instant, so bookings bucket into the day the user
// actually experiences them (their timezone), matching the date pickers.
function dayKey(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function clockLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function dayHeader(dayStr) {
  const d = new Date(`${dayStr}T00:00:00`);
  return {
    weekday: d.toLocaleDateString('en-IN', { weekday: 'long' }),
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  };
}

function rangeLabel(dayStr) {
  return new Date(`${dayStr}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function CalendarView() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canCreate = hasRole(...MANAGER_UP);

  const [anchor, setAnchor] = useState(todayInput());
  const [locationId, setLocationId] = useState('');

  const { data: locations = [] } = useAdminLocations();

  const from = combineDateTimeISO(anchor, '00:00');
  const to = combineDateTimeISO(addDays(anchor, WINDOW_DAYS), '00:00');
  const calendarQ = useCalendar({ locationId, from, to });
  const bookings = calendarQ.data || [];

  const days = useMemo(
    () => Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(anchor, i)),
    [anchor]
  );

  // Bucket each booking onto its pick-up day and its return day. A trip spanning
  // several days rightly appears twice — once to hand over, once to receive back.
  const { pickupsByDay, returnsByDay } = useMemo(() => {
    const pickupsByDay = {};
    const returnsByDay = {};
    for (const b of bookings) {
      const pk = dayKey(b.startAt);
      const rt = dayKey(b.endAt);
      (pickupsByDay[pk] ||= []).push(b);
      (returnsByDay[rt] ||= []).push(b);
    }
    return { pickupsByDay, returnsByDay };
  }, [bookings]);

  const today = todayInput();
  const weekLabel = `${rangeLabel(anchor)} – ${rangeLabel(addDays(anchor, WINDOW_DAYS - 1))}`;

  const locationOptions = [
    { value: '', label: 'All locations' },
    ...locations.map((l) => ({ value: l._id, label: l.name })),
  ];

  const shift = (delta) => setAnchor((a) => addDays(a, delta));

  return (
    <>
      <AdminPageHeader
        title="Calendar"
        description="Upcoming pick-ups and returns across your fleet."
        actions={
          canCreate ? (
            <Button to={ROUTES.adminBookingNew} leftIcon={<Plus className="h-4 w-4" />}>
              New booking
            </Button>
          ) : null
        }
      />

      {/* Toolbar: week navigation + location filter */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => shift(-WINDOW_DAYS)} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setAnchor(today)}>
            Today
          </Button>
          <Button variant="secondary" size="sm" onClick={() => shift(WINDOW_DAYS)} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-1 text-sm font-medium text-fg-strong">{weekLabel}</span>
        </div>
        <div className="sm:w-56">
          <Select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            options={locationOptions}
            aria-label="Filter by location"
          />
        </div>
      </div>

      {calendarQ.isError ? (
        <ErrorState
          title="Could not load the calendar"
          error={extractApiError(calendarQ.error).message}
          onRetry={calendarQ.refetch}
        />
      ) : calendarQ.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {days.map((day) => {
            const pickups = pickupsByDay[day] || [];
            const returns = returnsByDay[day] || [];
            const isToday = day === today;
            const { weekday, date } = dayHeader(day);
            const empty = !pickups.length && !returns.length;

            return (
              <Card key={day} className={isToday ? 'ring-1 ring-signal' : undefined}>
                <div className="flex items-center justify-between border-b border-hair px-5 py-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-semibold text-fg-strong">{weekday}</span>
                    <span className="text-sm text-muted">{date}</span>
                    {isToday && (
                      <span className="rounded-full bg-signal/15 px-2 py-0.5 text-[11px] font-semibold text-signal-700 dark:text-signal-300">
                        Today
                      </span>
                    )}
                  </div>
                  {!empty && (
                    <span className="text-xs text-muted">
                      {pickups.length} out · {returns.length} in
                    </span>
                  )}
                </div>
                <CardBody>
                  {empty ? (
                    <p className="py-2 text-sm text-muted">Nothing scheduled.</p>
                  ) : (
                    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                      <AgendaColumn
                        title="Pick-ups"
                        icon={ArrowUpRight}
                        accent="text-emerald-600 dark:text-emerald-400"
                        items={pickups}
                        timeOf={(b) => clockLabel(b.startAt)}
                        onOpen={(b) => navigate(ROUTES.adminBooking(b._id))}
                      />
                      <AgendaColumn
                        title="Returns"
                        icon={ArrowDownLeft}
                        accent="text-sky-600 dark:text-sky-400"
                        items={returns}
                        timeOf={(b) => clockLabel(b.endAt)}
                        onOpen={(b) => navigate(ROUTES.adminBooking(b._id))}
                      />
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function AgendaColumn({ title, icon: Icon, accent, items, timeOf, onOpen }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className={`h-4 w-4 ${accent}`} />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {title} <span className="text-muted/70">({items.length})</span>
        </h3>
      </div>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((b) => (
            <li key={`${title}-${b._id}`}>
              <button
                type="button"
                onClick={() => onOpen(b)}
                className="flex w-full items-center gap-3 rounded-lg border border-hair p-2.5 text-left transition-colors hover:border-fg/30 hover:bg-surface/60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface text-muted ring-1 ring-hair">
                  <Car className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg-strong">
                    {vehicleTitle(b.vehicleId) || '—'}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {b.vehicleId?.registrationNumber || b.bookingNumber}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs font-medium tabular-nums text-fg">{timeOf(b)}</span>
                  <StatusBadge status={b.status} size="sm" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">—</p>
      )}
    </div>
  );
}
