import { Link, useParams } from 'react-router-dom';
import { CalendarRange, Car, CheckCircle2, ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { useBooking } from '../features/bookings/hooks';
import { useSettings } from '../features/settings/hooks';
import { QuoteBreakdown, bookingToQuote } from '../features/bookings/QuoteBreakdown';
import { vehicleImage, vehicleTitle } from '../features/vehicles/display';
import { Button, Card, CardBody, StatusBadge, ErrorState, Skeleton } from '../components/ui';
import { ROUTES } from '../lib/constants';
import { formatMoney, formatDate } from '../lib/formatters';
import { formatClock } from '../lib/datetime';

export default function BookingConfirmed() {
  const { id } = useParams();
  const { data: booking, isLoading, isError, error, refetch } = useBooking(id);
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';

  if (isLoading) return <ConfirmedSkeleton />;
  if (isError || !booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState error={error || 'We couldn’t load this booking.'} onRetry={refetch} />
      </div>
    );
  }

  const vehicle = booking.vehicleId || {};
  const location = booking.locationId || {};
  const img = vehicleImage(vehicle);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-route/15 text-route">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-fg-strong sm:text-3xl">
          Your booking is in!
        </h1>
        <p className="mt-2 text-muted">
          Booking reference{' '}
          <span className="font-semibold text-fg-strong">{booking.bookingNumber}</span>. We’ll review and
          confirm it shortly — you can track its status any time.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <StatusBadge status={booking.status} kind="booking" />
          {booking.paymentStatus && <StatusBadge status={booking.paymentStatus} kind="payment" />}
        </div>
      </div>

      <Card className="mt-8">
        <CardBody className="p-0">
          {/* Vehicle */}
          <div className="flex gap-4 border-b border-hair p-5">
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-paper">
              {img ? (
                <img src={img} alt={vehicleTitle(vehicle)} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted">
                  <Car className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-bold text-fg-strong">{vehicleTitle(vehicle)}</p>
              {vehicle.registrationNumber && (
                <p className="mt-0.5 text-sm text-muted">{vehicle.registrationNumber}</p>
              )}
            </div>
          </div>

          {/* Trip */}
          <div className="space-y-3 border-b border-hair p-5 text-sm">
            <Line icon={MapPin} label="Location">
              {location.name ? (location.city ? `${location.name} — ${location.city}` : location.name) : '—'}
            </Line>
            <Line icon={CalendarRange} label="Pick-up">
              {formatDate(booking.pickupDate)} · {formatClock(booking.pickupTime)}
            </Line>
            <Line icon={CalendarRange} label="Return">
              {formatDate(booking.returnDate)} · {formatClock(booking.returnTime)}
            </Line>
          </div>

          {/* Price */}
          <div className="p-5">
            <QuoteBreakdown quote={bookingToQuote(booking)} currency={currency} />

            {(booking.amountPaid > 0 || booking.amountRemaining > 0) && (
              <div className="mt-4 space-y-1 border-t border-hair pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Paid</span>
                  <span className="font-medium tabular-nums text-fg-strong">
                    {formatMoney(booking.amountPaid || 0, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Balance due</span>
                  <span className="font-medium tabular-nums text-fg-strong">
                    {formatMoney(booking.amountRemaining || 0, currency)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {booking.specialRequests && (
        <div className="mt-4 flex gap-2 rounded-xl border border-hair bg-paper/60 p-4 text-sm">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-signal-600" />
          <div>
            <p className="font-medium text-fg-strong">Your note</p>
            <p className="mt-0.5 text-muted">{booking.specialRequests}</p>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button to={ROUTES.accountBooking(booking._id)} rightIcon={<ChevronRight className="h-4 w-4" />}>
          View booking details
        </Button>
        <Button to={ROUTES.cars} variant="secondary">
          Browse more cars
        </Button>
      </div>
    </div>
  );
}

function Line({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
      <span className="text-right font-medium text-fg-strong">{children}</span>
    </div>
  );
}

function ConfirmedSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="flex flex-col items-center">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="mt-5 h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-80" />
      </div>
      <Skeleton className="mt-8 h-72 w-full rounded-2xl" />
    </div>
  );
}
