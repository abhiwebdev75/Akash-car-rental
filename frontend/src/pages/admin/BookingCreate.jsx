import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Check,
  Search,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useUsers } from '../../features/users/hooks';
import { useAdminLocations } from '../../features/locations/hooks';
import { useAvailability } from '../../features/vehicles/hooks';
import { useQuoteBooking, useCreateBooking } from '../../features/bookings/hooks';
import { QuoteBreakdown } from '../../features/bookings/QuoteBreakdown';
import { useSettings } from '../../features/settings/hooks';
import { vehicleImage, vehicleTitle } from '../../features/vehicles/display';
import { useToast } from '../../context/ToastContext';
import { extractApiError } from '../../lib/apiClient';
import { ROUTES } from '../../lib/constants';
import { formatMoney, initials } from '../../lib/formatters';
import { addDays, todayInput, isValidRange, combineDateTimeISO } from '../../lib/datetime';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  Input,
  Select,
  Skeleton,
  Textarea,
} from '../../components/ui';

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

export default function BookingCreate() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';

  const [customer, setCustomer] = useState(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [trip, setTrip] = useState(() => ({
    locationId: '',
    pickupDate: todayInput(),
    pickupTime: '10:00',
    returnDate: addDays(todayInput(), 2),
    returnTime: '10:00',
  }));
  const [vehicleId, setVehicleId] = useState('');
  const [couponDraft, setCouponDraft] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);

  const setTripField = (key) => (e) =>
    setTrip((t) => {
      const next = { ...t, [key]: e.target.value };
      if (key === 'pickupDate' && next.returnDate < next.pickupDate) next.returnDate = next.pickupDate;
      if (key === 'locationId') setVehicleId(''); // vehicles are location-specific
      return next;
    });

  const rangeOk = isValidRange(trip.pickupDate, trip.pickupTime, trip.returnDate, trip.returnTime);

  // ── Customer search (managerUp directory) ──
  const searching = customerQuery.trim().length >= 2;
  const customersQ = useUsers({ role: 'CUSTOMER', q: customerQuery.trim(), limit: 6 });

  const { data: locations = [] } = useAdminLocations();
  const locationOptions = [
    { value: '', label: 'Select location' },
    ...locations.map((l) => ({ value: l._id, label: l.city ? `${l.name} — ${l.city}` : l.name })),
  ];

  // ── Availability (only once a location + valid range is chosen) ──
  const start = combineDateTimeISO(trip.pickupDate, trip.pickupTime);
  const end = combineDateTimeISO(trip.returnDate, trip.returnTime);
  const availabilityQ = useAvailability(
    { locationId: trip.locationId, start, end },
    { enabled: !!trip.locationId && rangeOk }
  );
  const availableVehicles = availabilityQ.data?.items || [];

  const { mutateAsync: requestQuote, isPending: quoting } = useQuoteBooking();
  const { mutateAsync: createBooking, isPending: creating } = useCreateBooking();

  // Re-quote whenever the priced inputs change.
  const quoteInputs = useMemo(
    () => ({
      vehicleId,
      pickupDate: trip.pickupDate,
      returnDate: trip.returnDate,
      pickupTime: trip.pickupTime,
      returnTime: trip.returnTime,
      ...(couponCode ? { couponCode } : {}),
    }),
    [vehicleId, trip, couponCode]
  );
  const quoteSignature = JSON.stringify(quoteInputs);
  const lastQuoted = useRef(null);

  useEffect(() => {
    if (!vehicleId || !rangeOk) {
      setQuote(null);
      return;
    }
    if (lastQuoted.current === quoteSignature) return;
    lastQuoted.current = quoteSignature;
    let cancelled = false;
    setQuoteError(null);
    requestQuote(quoteInputs)
      .then((res) => !cancelled && setQuote(res))
      .catch((e) => {
        if (cancelled) return;
        lastQuoted.current = null;
        setQuote(null);
        setQuoteError(extractApiError(e));
      });
    return () => {
      cancelled = true;
    };
  }, [vehicleId, rangeOk, quoteSignature, quoteInputs, requestQuote]);

  const canSubmit = customer && vehicleId && trip.locationId && rangeOk && quote && !quoting;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      const booking = await createBooking({
        ...quoteInputs,
        customerId: customer._id,
        locationId: trip.locationId,
        specialRequests: specialRequests || '',
      });
      toast.success('Booking created');
      navigate(ROUTES.adminBooking(booking._id));
    } catch (e) {
      toast.error(extractApiError(e).message);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="New booking"
        description="Create a walk-in or phone booking for an existing customer."
        backTo={ROUTES.adminBookings}
        backLabel="Bookings"
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* 1 · Customer */}
          <Card>
            <CardHeader>
              <h2 className="font-display text-lg font-semibold text-fg-strong">Customer</h2>
            </CardHeader>
            <CardBody>
              {customer ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-hair bg-surface/60 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-signal/15 text-sm font-semibold text-signal-700 dark:text-signal-300">
                      {initials(customer.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-fg-strong">{customer.name}</p>
                      <p className="truncate text-sm text-muted">
                        {customer.email}
                        {customer.phone ? ` · ${customer.phone}` : ''}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCustomer(null)} leftIcon={<X className="h-4 w-4" />}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder="Search by name, email or phone…"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                  />
                  {searching && (
                    <div className="rounded-lg border border-hair">
                      {customersQ.isLoading ? (
                        <div className="space-y-2 p-3">
                          <Skeleton className="h-5 w-2/3" />
                          <Skeleton className="h-5 w-1/2" />
                        </div>
                      ) : customersQ.data?.items?.length ? (
                        <ul className="divide-y divide-hair">
                          {customersQ.data.items.map((u) => (
                            <li key={u._id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomer(u);
                                  setCustomerQuery('');
                                }}
                                className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-ink-900/5 dark:hover:bg-white/5"
                              >
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-xs font-semibold text-fg">
                                  {initials(u.name)}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate font-medium text-fg-strong">{u.name}</span>
                                  <span className="block truncate text-sm text-muted">
                                    {u.email}
                                    {u.phone ? ` · ${u.phone}` : ''}
                                  </span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="p-3 text-sm text-muted">
                          No customers match “{customerQuery.trim()}”. They must have a customer account to be booked in.
                        </p>
                      )}
                    </div>
                  )}
                  {!searching && (
                    <p className="flex items-center gap-2 text-xs text-muted">
                      <UserIcon className="h-3.5 w-3.5" /> Type at least 2 characters to search existing customers.
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* 2 · Trip */}
          <Card>
            <CardHeader>
              <h2 className="font-display text-lg font-semibold text-fg-strong">Trip</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Select
                label="Pick-up & return location"
                options={locationOptions}
                value={trip.locationId}
                onChange={setTripField('locationId')}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input type="date" label="Pick-up date" min={todayInput()} value={trip.pickupDate} onChange={setTripField('pickupDate')} />
                <Select label="Pick-up time" options={TIME_SLOTS} value={trip.pickupTime} onChange={setTripField('pickupTime')} />
                <Input type="date" label="Return date" min={trip.pickupDate} value={trip.returnDate} onChange={setTripField('returnDate')} />
                <Select label="Return time" options={TIME_SLOTS} value={trip.returnTime} onChange={setTripField('returnTime')} />
              </div>
              {!rangeOk && <p className="text-sm text-red-600 dark:text-red-400">Return must be after pick-up.</p>}
            </CardBody>
          </Card>

          {/* 3 · Vehicle */}
          <Card>
            <CardHeader>
              <h2 className="font-display text-lg font-semibold text-fg-strong">Vehicle</h2>
            </CardHeader>
            <CardBody>
              {!trip.locationId || !rangeOk ? (
                <p className="text-sm text-muted">Choose a location and valid dates to see available vehicles.</p>
              ) : availabilityQ.isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              ) : availabilityQ.isError ? (
                <ErrorState error={extractApiError(availabilityQ.error).message} onRetry={availabilityQ.refetch} />
              ) : availableVehicles.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableVehicles.map((v) => {
                    const active = v._id === vehicleId;
                    return (
                      <button
                        key={v._id}
                        type="button"
                        onClick={() => setVehicleId(v._id)}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                          active
                            ? 'border-signal bg-signal/5 ring-1 ring-signal'
                            : 'border-hair hover:border-fg/30'
                        }`}
                      >
                        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-surface ring-1 ring-hair">
                          {vehicleImage(v) ? (
                            <img src={vehicleImage(v)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted">
                              <Car className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-fg-strong">{vehicleTitle(v)}</p>
                          <p className="truncate text-xs text-muted">{v.registrationNumber}</p>
                          <p className="mt-0.5 text-sm font-semibold text-fg">{formatMoney(v.dailyPrice, currency)}/day</p>
                        </div>
                        {active && <Check className="h-5 w-5 shrink-0 text-signal" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted">No vehicles are available at this location for the selected dates.</p>
              )}
            </CardBody>
          </Card>

          {/* 4 · Extras */}
          <Card>
            <CardHeader>
              <h2 className="font-display text-lg font-semibold text-fg-strong">Coupon & notes</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label htmlFor="coupon" className="mb-1.5 block text-sm font-medium text-fg-strong">
                  Coupon code
                </label>
                <div className="flex gap-2">
                  <Input
                    id="coupon"
                    placeholder="Optional"
                    value={couponDraft}
                    onChange={(e) => setCouponDraft(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCouponCode(couponDraft.trim())}
                    disabled={!couponDraft.trim()}
                  >
                    Apply
                  </Button>
                </div>
                {couponCode && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-route-700 dark:text-route-300">
                    <Check className="h-3.5 w-3.5" /> Code “{couponCode}” applied; any valid discount shows in the price.
                  </p>
                )}
              </div>
              <Textarea
                label="Special requests"
                rows={3}
                placeholder="Anything to note? (optional)"
                value={specialRequests}
                maxLength={1000}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </CardBody>
          </Card>
        </div>

        {/* Summary rail */}
        <aside className="lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-semibold text-fg-strong">Summary</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <SummaryRow label="Customer" value={customer?.name || 'Not selected'} />
              <SummaryRow
                label="Vehicle"
                value={vehicleId ? vehicleTitle(availableVehicles.find((v) => v._id === vehicleId)) : 'Not selected'}
              />

              <div className="border-t border-hair pt-4">
                {!vehicleId || !rangeOk ? (
                  <p className="text-sm text-muted">Pick a customer, dates and a vehicle to see the price.</p>
                ) : quoteError ? (
                  <ErrorState
                    error={quoteError}
                    onRetry={() => {
                      lastQuoted.current = null;
                      setQuoteError(null);
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

              <Button fullWidth onClick={submit} loading={creating} disabled={!canSubmit} leftIcon={<ShieldCheck className="h-4 w-4" />}>
                Create booking
              </Button>
              {customer && vehicleId && rangeOk && !quote && !quoting && !quoteError && (
                <p className="text-center text-xs text-muted">Preparing quote…</p>
              )}
            </CardBody>
          </Card>
        </aside>
      </div>
    </>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="truncate text-right font-medium text-fg-strong">{value}</span>
    </div>
  );
}
