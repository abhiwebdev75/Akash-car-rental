import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Ban,
  Car,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  XCircle,
} from 'lucide-react';
import { useBooking, useCancelBooking } from '../features/bookings/hooks';
import { useCreateReview } from '../features/reviews/hooks';
import { useSettings } from '../features/settings/hooks';
import { QuoteBreakdown, bookingToQuote } from '../features/bookings/QuoteBreakdown';
import { vehicleImage, vehicleTitle } from '../features/vehicles/display';
import {
  Button,
  Card,
  CardBody,
  StatusBadge,
  Modal,
  Textarea,
  Rating,
  ErrorState,
  Skeleton,
} from '../components/ui';
import { ROUTES, BOOKING_STATUS } from '../lib/constants';
import { formatMoney, formatDate } from '../lib/formatters';
import { formatClock } from '../lib/datetime';
import { extractApiError } from '../lib/apiClient';

const CANCELLABLE = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED];

export default function AccountBooking() {
  const { id } = useParams();
  const { data: booking, isLoading, isError, error, refetch } = useBooking(id);
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';

  const cancelM = useCancelBooking();
  const reviewM = useCreateReview();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelErr, setCancelErr] = useState(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewErr, setReviewErr] = useState(null);
  const [reviewDone, setReviewDone] = useState(false);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !booking) {
    return (
      <div className="mx-auto max-w-content px-4 py-16">
        <ErrorState error={error || 'We couldn’t load this booking.'} onRetry={refetch} />
      </div>
    );
  }

  const vehicle = booking.vehicleId || {};
  const location = booking.locationId || {};
  const img = vehicleImage(vehicle);
  const canCancel = CANCELLABLE.includes(booking.status);
  const canReview = booking.status === BOOKING_STATUS.COMPLETED && !reviewDone;

  const submitCancel = async () => {
    setCancelErr(null);
    try {
      await cancelM.mutateAsync({ id: booking._id, reason: cancelReason });
      setCancelOpen(false);
      setCancelReason('');
    } catch (e) {
      setCancelErr(extractApiError(e));
    }
  };

  const submitReview = async () => {
    setReviewErr(null);
    if (rating < 1) {
      setReviewErr({ message: 'Please choose a star rating.' });
      return;
    }
    try {
      await reviewM.mutateAsync({ bookingId: booking._id, rating, review: reviewText });
      setReviewDone(true);
      setReviewOpen(false);
    } catch (e) {
      setReviewErr(extractApiError(e));
    }
  };

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:py-10">
      <Link
        to={ROUTES.account}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg-strong"
      >
        <ChevronLeft className="h-4 w-4" />
        All bookings
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg-strong sm:text-3xl">
            Booking {booking.bookingNumber}
          </h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDate(booking.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={booking.status} kind="booking" />
          {booking.paymentStatus && <StatusBadge status={booking.paymentStatus} kind="payment" />}
        </div>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        {/* Details */}
        <div className="min-w-0 space-y-6">
          <Card>
            <CardBody className="p-0">
              <div className="flex gap-4 p-5">
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
                  {vehicle._id && (
                    <Link
                      to={ROUTES.vehicle(vehicle._id)}
                      className="mt-2 inline-block text-sm font-semibold text-signal-700 hover:text-signal-600 dark:text-signal-400"
                    >
                      View car details →
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid gap-3 border-t border-hair p-5 text-sm sm:grid-cols-2">
                <Detail icon={MapPin} label="Location">
                  {location.name
                    ? location.city
                      ? `${location.name} — ${location.city}`
                      : location.name
                    : '—'}
                </Detail>
                <Detail icon={Clock} label="Duration">
                  {booking.pricingBreakdown?.days
                    ? `${booking.pricingBreakdown.days} day${booking.pricingBreakdown.days > 1 ? 's' : ''}`
                    : '—'}
                </Detail>
                <Detail icon={CalendarRange} label="Pick-up">
                  {formatDate(booking.pickupDate)} · {formatClock(booking.pickupTime)}
                </Detail>
                <Detail icon={CalendarRange} label="Return">
                  {formatDate(booking.returnDate)} · {formatClock(booking.returnTime)}
                </Detail>
              </div>

              {booking.specialRequests && (
                <div className="flex gap-2 border-t border-hair p-5 text-sm">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-signal-600" />
                  <div>
                    <p className="font-medium text-fg-strong">Your note</p>
                    <p className="mt-0.5 text-muted">{booking.specialRequests}</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {booking.status === BOOKING_STATUS.CANCELLED && booking.cancellation && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900/40 dark:bg-red-950/20">
              <p className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-300">
                <Ban className="h-4 w-4" /> Booking cancelled
              </p>
              {booking.cancellation.at && (
                <p className="mt-1 text-muted">On {formatDate(booking.cancellation.at)}</p>
              )}
              {booking.cancellation.reason && (
                <p className="mt-1 text-fg">“{booking.cancellation.reason}”</p>
              )}
              {typeof booking.cancellation.refundAmount === 'number' && booking.cancellation.refundAmount > 0 && (
                <p className="mt-1 text-muted">
                  Refund: {formatMoney(booking.cancellation.refundAmount, currency)}
                </p>
              )}
            </div>
          )}

          <Card>
            <CardBody>
              <h2 className="mb-4 font-display text-lg font-semibold text-fg-strong">Price details</h2>
              <QuoteBreakdown quote={bookingToQuote(booking)} currency={currency} />
              <div className="mt-4 space-y-1 border-t border-hair pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Amount paid</span>
                  <span className="font-medium tabular-nums text-fg-strong">
                    {formatMoney(booking.amountPaid || 0, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-fg-strong">Balance due</span>
                  <span className="font-bold tabular-nums text-fg-strong">
                    {formatMoney(booking.amountRemaining || 0, currency)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar: timeline + actions */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardBody>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Status</h2>
              <StatusTimeline status={booking.status} />
            </CardBody>
          </Card>

          {(canCancel || canReview) && (
            <Card>
              <CardBody className="space-y-3">
                {canReview && (
                  <Button fullWidth leftIcon={<Star className="h-4 w-4" />} onClick={() => setReviewOpen(true)}>
                    Leave a review
                  </Button>
                )}
                {canCancel && (
                  <Button
                    fullWidth
                    variant="danger"
                    leftIcon={<XCircle className="h-4 w-4" />}
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel booking
                  </Button>
                )}
              </CardBody>
            </Card>
          )}

          {reviewDone && (
            <div className="rounded-xl border border-route/30 bg-route/5 p-4 text-sm text-fg">
              <p className="flex items-center gap-2 font-medium text-route-700 dark:text-route-300">
                <CheckCircle2 className="h-4 w-4" /> Thanks for your review!
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Cancel modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this booking?"
        description="This can’t be undone. Let us know why, if you like."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Keep booking
            </Button>
            <Button variant="danger" loading={cancelM.isPending} onClick={submitCancel}>
              Cancel booking
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason (optional)"
          rows={3}
          maxLength={500}
          placeholder="e.g. Change of plans"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
        {cancelErr && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{cancelErr.message}</p>
        )}
      </Modal>

      {/* Review modal */}
      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Rate your rental"
        description={`How was the ${vehicleTitle(vehicle)}?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReviewOpen(false)}>
              Cancel
            </Button>
            <Button loading={reviewM.isPending} onClick={submitReview}>
              Submit review
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-medium text-fg-strong">Your rating</p>
            <Rating value={rating} onChange={setRating} size="lg" />
          </div>
          <Textarea
            label="Your review (optional)"
            rows={4}
            maxLength={2000}
            placeholder="Tell others about your experience"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
          {reviewErr && (
            <p className="text-sm text-red-600 dark:text-red-400">{reviewErr.message}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

function Detail({ icon: Icon, label, children }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 font-medium text-fg-strong">{children}</p>
    </div>
  );
}

const FLOW = [
  { key: BOOKING_STATUS.PENDING, label: 'Booked', hint: 'We’ve received your booking', icon: Clock },
  { key: BOOKING_STATUS.CONFIRMED, label: 'Confirmed', hint: 'Your car is reserved', icon: CheckCircle2 },
  { key: BOOKING_STATUS.ACTIVE, label: 'On rental', hint: 'Vehicle picked up', icon: Car },
  { key: BOOKING_STATUS.COMPLETED, label: 'Completed', hint: 'Vehicle returned', icon: ShieldCheck },
];

function StatusTimeline({ status }) {
  if (status === BOOKING_STATUS.CANCELLED || status === BOOKING_STATUS.NO_SHOW) {
    const label = status === BOOKING_STATUS.CANCELLED ? 'Cancelled' : 'No-show';
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-50 p-3 dark:bg-red-950/20">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
          <Ban className="h-4 w-4" />
        </span>
        <span className="font-medium text-fg-strong">{label}</span>
      </div>
    );
  }

  const activeIdx = FLOW.findIndex((s) => s.key === status);

  return (
    <ol className="relative space-y-6">
      {FLOW.map((s, i) => {
        const done = i < activeIdx;
        const current = i === activeIdx;
        const Icon = s.icon;
        return (
          <li key={s.key} className="relative flex gap-3">
            {i < FLOW.length - 1 && (
              <span
                className={cnLine(i < activeIdx)}
                aria-hidden="true"
              />
            )}
            <span
              className={[
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                done && 'border-route bg-route text-white',
                current && 'border-signal bg-signal text-ink-900',
                !done && !current && 'border-hair bg-surface text-muted',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="pt-0.5">
              <p
                className={[
                  'text-sm font-semibold',
                  current || done ? 'text-fg-strong' : 'text-muted',
                ].join(' ')}
              >
                {s.label}
              </p>
              <p className="text-xs text-muted">{s.hint}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Connector line between timeline nodes; teal once the step is complete.
function cnLine(complete) {
  return [
    'absolute left-4 top-8 h-6 w-px -translate-x-1/2',
    complete ? 'bg-route' : 'bg-hair',
  ].join(' ');
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-content px-4 py-10">
      <Skeleton className="mb-6 h-5 w-32" />
      <Skeleton className="h-9 w-64" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}
