import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Check,
  ChevronLeft,
  Info,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { useVehicle } from '../features/vehicles/hooks';
import { vehicleImage, vehicleTitle } from '../features/vehicles/display';
import { useLocations } from '../features/locations/hooks';
import { useAddOns } from '../features/addons/hooks';
import { useSettings } from '../features/settings/hooks';
import { useQuoteBooking, useCreateBooking } from '../features/bookings/hooks';
import { QuoteBreakdown } from '../features/bookings/QuoteBreakdown';
import { Button, Input, Select, Textarea, Card, CardBody, Badge, ErrorState, Skeleton } from '../components/ui';
import { ROUTES } from '../lib/constants';
import { cn } from '../lib/cn';
import { formatMoney, formatDate } from '../lib/formatters';
import { addDays, todayInput, isValidRange } from '../lib/datetime';
import { extractApiError } from '../lib/apiClient';

// Half-hour slots (06:00–21:30), matching the hero search widget.
const TIME_SLOTS = (() => {
  const out = [];
  for (let h = 6; h <= 21; h += 1) {
    for (const m of [0, 30]) {
      const v = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const period = h < 12 ? 'AM' : 'PM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      out.push({ value: v, label: `${h12}:${String(m).padStart(2, '0')} ${period}` });
    }
  }
  return out;
})();
const TIME_LABEL = Object.fromEntries(TIME_SLOTS.map((s) => [s.value, s.label]));

// How each add-on's price reads. Values match the backend ADDON_PRICING_TYPE enum.
const PRICING_SUFFIX = { PER_RENTAL: 'per rental', PER_DAY: 'per day', PER_UNIT: 'each' };

const STEPS = [
  { n: 1, label: 'Trip' },
  { n: 2, label: 'Extras' },
  { n: 3, label: 'Review' },
];

// { [addOnId]: qty } (qty >= 1 means included) → the API's array form.
function toAddOnArray(map) {
  return Object.entries(map)
    .filter(([, q]) => q > 0)
    .map(([addOnId, quantity]) => ({ addOnId, quantity }));
}

export default function Booking() {
  const { vehicleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: vehicle, isLoading: vehicleLoading, isError, error, refetch } = useVehicle(vehicleId);
  const { data: locations = [] } = useLocations();
  const { data: addOns = [] } = useAddOns();
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';

  const { mutateAsync: requestQuote, isPending: quoting } = useQuoteBooking();
  const { mutateAsync: createBooking, isPending: creating } = useCreateBooking();

  const [step, setStep] = useState(1);

  // Trip is pre-filled from the URL (carried from the catalog / detail page).
  const [trip, setTrip] = useState(() => ({
    locationId: searchParams.get('locationId') || '',
    pickupDate: searchParams.get('pickupDate') || todayInput(),
    pickupTime: searchParams.get('pickupTime') || '10:00',
    returnDate: searchParams.get('returnDate') || addDays(todayInput(), 3),
    returnTime: searchParams.get('returnTime') || '10:00',
  }));
  const setTripField = (key) => (e) =>
    setTrip((t) => {
      const next = { ...t, [key]: e.target.value };
      // Keep the return date on/after pickup.
      if (key === 'pickupDate' && next.returnDate < next.pickupDate) next.returnDate = next.pickupDate;
      return next;
    });

  const [selected, setSelected] = useState({}); // add-ons: { id: qty }
  const [couponDraft, setCouponDraft] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);
  const [createError, setCreateError] = useState(null);

  const rangeOk = isValidRange(trip.pickupDate, trip.pickupTime, trip.returnDate, trip.returnTime);

  // Everything the trusted quote depends on. specialRequests is excluded — it
  // never affects price.
  const quoteInputs = useMemo(
    () => ({
      vehicleId,
      pickupDate: trip.pickupDate,
      returnDate: trip.returnDate,
      pickupTime: trip.pickupTime,
      returnTime: trip.returnTime,
      addOns: toAddOnArray(selected),
      ...(couponCode ? { couponCode } : {}),
    }),
    [vehicleId, trip, selected, couponCode]
  );
  const quoteSignature = JSON.stringify(quoteInputs);
  const lastQuoted = useRef(null);

  // Fetch a fresh price whenever we land on Review (or an input behind it
  // changes). Guarded by signature so it fires once per distinct request, even
  // under React StrictMode's double-invoke.
  useEffect(() => {
    if (step !== 3 || !rangeOk) return;
    if (lastQuoted.current === quoteSignature) return;
    lastQuoted.current = quoteSignature;
    let cancelled = false;
    setQuoteError(null);
    requestQuote(quoteInputs)
      .then((res) => {
        if (!cancelled) setQuote(res);
      })
      .catch((e) => {
        if (cancelled) return;
        lastQuoted.current = null; // allow a retry
        setQuote(null);
        setQuoteError(extractApiError(e));
      });
    return () => {
      cancelled = true;
    };
  }, [step, rangeOk, quoteSignature, quoteInputs, requestQuote]);

  const locationName = useMemo(() => {
    const l = locations.find((x) => x._id === trip.locationId);
    return l ? (l.city ? `${l.name} — ${l.city}` : l.name) : null;
  }, [locations, trip.locationId]);

  if (vehicleLoading) return <BookingSkeleton />;
  if (isError || !vehicle) {
    return (
      <div className="mx-auto max-w-content px-4 py-16">
        <ErrorState error={error || 'We couldn’t load this car.'} onRetry={refetch} />
      </div>
    );
  }

  const title = vehicleTitle(vehicle);
  const canLeaveTrip = rangeOk && !!trip.locationId;

  const goNext = () => setStep((s) => Math.min(3, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const applyCoupon = () => setCouponCode(couponDraft.trim());

  const confirm = async () => {
    setCreateError(null);
    try {
      const booking = await createBooking({
        ...quoteInputs,
        locationId: trip.locationId,
        specialRequests: specialRequests || '',
      });
      navigate(ROUTES.bookingConfirmed(booking._id), { replace: true });
    } catch (e) {
      setCreateError(extractApiError(e));
    }
  };

  const locationOptions = [
    { value: '', label: 'Select a pick-up location' },
    ...locations.map((l) => ({ value: l._id, label: l.city ? `${l.name} — ${l.city}` : l.name })),
  ];

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:py-10">
      <Link
        to={ROUTES.vehicle(vehicleId)}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg-strong"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {title}
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-fg-strong sm:text-3xl">Complete your booking</h1>
        <Stepper step={step} />
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {step === 1 && (
            <StepCard title="Your trip" subtitle="Where and when you’ll pick the car up.">
              <div className="grid gap-4">
                <Select
                  label="Pick-up & return location"
                  options={locationOptions}
                  value={trip.locationId}
                  onChange={setTripField('locationId')}
                  hint="Return the car to the same location."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    type="date"
                    label="Pick-up date"
                    min={todayInput()}
                    value={trip.pickupDate}
                    onChange={setTripField('pickupDate')}
                  />
                  <Select
                    label="Pick-up time"
                    options={TIME_SLOTS}
                    value={trip.pickupTime}
                    onChange={setTripField('pickupTime')}
                  />
                  <Input
                    type="date"
                    label="Return date"
                    min={trip.pickupDate}
                    value={trip.returnDate}
                    onChange={setTripField('returnDate')}
                  />
                  <Select
                    label="Return time"
                    options={TIME_SLOTS}
                    value={trip.returnTime}
                    onChange={setTripField('returnTime')}
                  />
                </div>
                {!rangeOk && (
                  <p className="text-sm text-red-600 dark:text-red-400">Return must be after pick-up.</p>
                )}
              </div>
            </StepCard>
          )}

          {step === 2 && (
            <StepCard title="Add extras" subtitle="Optional add-ons for your trip. You can skip these.">
              {addOns.length === 0 ? (
                <p className="text-sm text-muted">No add-ons are available right now.</p>
              ) : (
                <ul className="divide-y divide-hair">
                  {addOns.map((a) => (
                    <AddOnRow
                      key={a._id}
                      addOn={a}
                      currency={currency}
                      qty={selected[a._id] || 0}
                      onChange={(qty) =>
                        setSelected((m) => {
                          const next = { ...m };
                          if (qty > 0) next[a._id] = qty;
                          else delete next[a._id];
                          return next;
                        })
                      }
                    />
                  ))}
                </ul>
              )}
            </StepCard>
          )}

          {step === 3 && (
            <StepCard title="Review & confirm" subtitle="Check the details, then confirm your booking.">
              <div className="grid gap-5">
                <div className="rounded-xl border border-hair bg-paper/60 p-4">
                  <dl className="grid gap-2 text-sm">
                    <SummaryLine icon={MapPin} label="Location" value={locationName || '—'} />
                    <SummaryLine
                      icon={CalendarRange}
                      label="Pick-up"
                      value={`${formatDate(trip.pickupDate)} · ${TIME_LABEL[trip.pickupTime] || trip.pickupTime}`}
                    />
                    <SummaryLine
                      icon={CalendarRange}
                      label="Return"
                      value={`${formatDate(trip.returnDate)} · ${TIME_LABEL[trip.returnTime] || trip.returnTime}`}
                    />
                  </dl>
                </div>

                <div>
                  <label htmlFor="coupon" className="mb-1.5 block text-sm font-medium text-fg-strong">
                    Coupon code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      placeholder="Have a code?"
                      value={couponDraft}
                      onChange={(e) => setCouponDraft(e.target.value)}
                      leftIcon={<Tag className="h-4 w-4" />}
                      className="flex-1"
                    />
                    <Button type="button" variant="secondary" onClick={applyCoupon} disabled={!couponDraft.trim()}>
                      Apply
                    </Button>
                  </div>
                  {couponCode && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-route-700 dark:text-route-300">
                      <Check className="h-3.5 w-3.5" /> Code “{couponCode}” applied. The discount, if valid, is shown in
                      the price.
                    </p>
                  )}
                </div>

                <Textarea
                  label="Special requests"
                  rows={3}
                  placeholder="Anything we should know? (optional)"
                  value={specialRequests}
                  maxLength={1000}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />

                {createError && <ErrorState error={createError} />}
              </div>
            </StepCard>
          )}

          {/* Step navigation */}
          <div className="mt-6 flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button variant="ghost" onClick={goBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back
              </Button>
            ) : (
              <span />
            )}

            {step < 3 ? (
              <Button
                onClick={goNext}
                disabled={step === 1 && !canLeaveTrip}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {step === 1 ? 'Continue to extras' : 'Continue to review'}
              </Button>
            ) : (
              <Button
                onClick={confirm}
                loading={creating}
                disabled={!quote || quoting}
                leftIcon={<ShieldCheck className="h-4 w-4" />}
              >
                Confirm booking
              </Button>
            )}
          </div>
        </div>

        {/* Summary rail */}
        <aside className="lg:sticky lg:top-24">
          <Card>
            <CardBody className="p-0">
              <div className="flex gap-3 border-b border-hair p-4">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-paper">
                  {vehicleImage(vehicle) ? (
                    <img src={vehicleImage(vehicle)} alt={title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <MapPin className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-fg-strong">{title}</p>
                  {vehicle.vehicleType && (
                    <Badge tone="muted" size="sm" className="mt-1">
                      {vehicle.vehicleType}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2 p-4 text-sm">
                <SummaryLine icon={MapPin} label="Location" value={locationName || 'Not selected'} />
                <SummaryLine
                  icon={CalendarRange}
                  label="Pick-up"
                  value={`${formatDate(trip.pickupDate)} · ${TIME_LABEL[trip.pickupTime] || trip.pickupTime}`}
                />
                <SummaryLine
                  icon={CalendarRange}
                  label="Return"
                  value={`${formatDate(trip.returnDate)} · ${TIME_LABEL[trip.returnTime] || trip.returnTime}`}
                />
              </div>

              <div className="border-t border-hair p-4">
                {step < 3 ? (
                  <p className="flex items-start gap-2 text-xs text-muted">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Your final price is calculated and shown on the review step.
                  </p>
                ) : quoteError ? (
                  <ErrorState
                    error={quoteError}
                    onRetry={() => {
                      lastQuoted.current = null;
                      setStep(3);
                    }}
                  />
                ) : !quote || quoting ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <QuoteBreakdown quote={quote.quote} currency={quote.currency || currency} />
                )}
              </div>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Stepper({ step }) {
  return (
    <ol className="mt-5 flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <li key={s.n} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                  done && 'border-route bg-route text-white',
                  active && 'border-signal bg-signal text-ink-900',
                  !done && !active && 'border-hair bg-surface text-muted'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : s.n}
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
                  active ? 'text-fg-strong' : 'text-muted',
                  'hidden sm:inline'
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-hair" />}
          </li>
        );
      })}
    </ol>
  );
}

function StepCard({ title, subtitle, children }) {
  return (
    <Card>
      <CardBody>
        <h2 className="font-display text-lg font-semibold text-fg-strong">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </CardBody>
    </Card>
  );
}

function SummaryLine({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
      <span className="text-right font-medium text-fg-strong">{value}</span>
    </div>
  );
}

function AddOnRow({ addOn, qty, onChange, currency }) {
  const canMultiply = addOn.pricingType === 'PER_UNIT' && (addOn.maxQuantity || 1) > 1;
  const suffix = PRICING_SUFFIX[addOn.pricingType] || '';
  const selected = qty > 0;

  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="font-medium text-fg-strong">{addOn.name}</p>
        {addOn.description && <p className="mt-0.5 text-sm text-muted">{addOn.description}</p>}
        <p className="mt-1 text-sm font-medium text-fg">
          {formatMoney(addOn.price, currency)}
          {suffix && <span className="font-normal text-muted"> {suffix}</span>}
        </p>
      </div>

      {canMultiply ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(Math.max(0, qty - 1))}
            disabled={qty === 0}
            aria-label={`Remove one ${addOn.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair text-fg transition-colors hover:bg-paper disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums text-fg-strong">{qty}</span>
          <button
            type="button"
            onClick={() => onChange(Math.min(addOn.maxQuantity, qty + 1))}
            disabled={qty >= addOn.maxQuantity}
            aria-label={`Add one ${addOn.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair text-fg transition-colors hover:bg-paper disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant={selected ? 'primary' : 'secondary'}
          onClick={() => onChange(selected ? 0 : 1)}
          leftIcon={selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          className="shrink-0"
        >
          {selected ? 'Added' : 'Add'}
        </Button>
      )}
    </li>
  );
}

function BookingSkeleton() {
  return (
    <div className="mx-auto max-w-content px-4 py-10">
      <Skeleton className="mb-6 h-5 w-40" />
      <Skeleton className="mb-8 h-9 w-72" />
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
