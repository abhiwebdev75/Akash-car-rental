import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BadgeCheck,
  Ban,
  Banknote,
  Car,
  CheckCircle2,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  useBooking,
  useConfirmBooking,
  useActivateBooking,
  useCompleteBooking,
  useCancelBooking,
} from '../../features/bookings/hooks';
import {
  usePayments,
  usePaymentBalance,
  useRecordPayment,
  useRefundPayment,
} from '../../features/payments/hooks';
import { bookingToQuote, QuoteBreakdown } from '../../features/bookings/QuoteBreakdown';
import { vehicleImage, vehicleTitle } from '../../features/vehicles/display';
import { useToast } from '../../context/ToastContext';
import { extractApiError } from '../../lib/apiClient';
import {
  BOOKING_STATUS,
  STAFF_UP,
  FINANCE_ROLES,
  ROUTES,
  PAYMENT_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_INFLOW_KIND_OPTIONS,
  PAYMENT_REFUND_KIND_OPTIONS,
} from '../../lib/constants';
import { formatMoney, formatDateTime, formatDate } from '../../lib/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { PageLoader } from '../../components/PageLoader';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  Modal,
  Input,
  Select,
  StatusBadge,
  Textarea,
} from '../../components/ui';

const OUTFLOW_KINDS = new Set(['REFUND', 'DEPOSIT_REFUND']);

export default function BookingDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const toast = useToast();

  const bookingQ = useBooking(id);
  const balanceQ = usePaymentBalance(id);
  const paymentsQ = usePayments(id);

  const confirmBooking = useConfirmBooking();
  const activateBooking = useActivateBooking();
  const completeBooking = useCompleteBooking();
  const cancelBooking = useCancelBooking();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [payMode, setPayMode] = useState(null); // 'record' | 'refund' | null

  const isStaffUp = hasRole(...STAFF_UP);
  const isFinance = hasRole(...FINANCE_ROLES);

  const booking = bookingQ.data;
  const currency = booking?.currency || 'INR';

  const runAction = async (mutation, successMsg) => {
    try {
      await mutation.mutateAsync(id);
      toast.success(successMsg);
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelBooking.mutateAsync({ id, reason: cancelReason.trim() });
      toast.success('Booking cancelled');
      setCancelOpen(false);
      setCancelReason('');
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  if (bookingQ.isLoading) return <PageLoader label="Loading booking" />;
  if (bookingQ.isError || !booking) {
    return (
      <ErrorState
        title="Could not load booking"
        error={extractApiError(bookingQ.error).message}
        onRetry={bookingQ.refetch}
      />
    );
  }

  const status = booking.status;
  const actionPending =
    confirmBooking.isPending || activateBooking.isPending || completeBooking.isPending;

  // Lifecycle buttons follow the service's allowed transitions and are ops-only
  // (STAFF_UP). Accountants manage money, not the vehicle lifecycle.
  const lifecycle = [];
  if (isStaffUp) {
    if (status === BOOKING_STATUS.PENDING) {
      lifecycle.push(
        <Button
          key="confirm"
          onClick={() => runAction(confirmBooking, 'Booking confirmed')}
          loading={confirmBooking.isPending}
          disabled={actionPending}
          leftIcon={<BadgeCheck className="h-4 w-4" />}
        >
          Confirm
        </Button>
      );
    }
    if (status === BOOKING_STATUS.CONFIRMED) {
      lifecycle.push(
        <Button
          key="activate"
          onClick={() => runAction(activateBooking, 'Vehicle marked as picked up')}
          loading={activateBooking.isPending}
          disabled={actionPending}
          leftIcon={<KeyRound className="h-4 w-4" />}
        >
          Mark picked up
        </Button>
      );
    }
    if (status === BOOKING_STATUS.ACTIVE) {
      lifecycle.push(
        <Button
          key="complete"
          onClick={() => runAction(completeBooking, 'Booking completed')}
          loading={completeBooking.isPending}
          disabled={actionPending}
          leftIcon={<CheckCircle2 className="h-4 w-4" />}
        >
          Mark returned
        </Button>
      );
    }
    if (status === BOOKING_STATUS.PENDING || status === BOOKING_STATUS.CONFIRMED) {
      lifecycle.push(
        <Button
          key="cancel"
          variant="danger"
          onClick={() => setCancelOpen(true)}
          disabled={actionPending}
          leftIcon={<Ban className="h-4 w-4" />}
        >
          Cancel
        </Button>
      );
    }
  }

  return (
    <>
      <AdminPageHeader
        title={booking.bookingNumber || 'Booking'}
        description={`Created ${formatDate(booking.createdAt)}`}
        backTo={ROUTES.adminBookings}
        backLabel="Bookings"
        actions={lifecycle.length ? <div className="flex flex-wrap gap-2">{lifecycle}</div> : null}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        <StatusBadge status={booking.paymentStatus} kind="payment" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* ── Left: trip, customer, location ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-display text-lg font-semibold text-fg-strong">Trip</h2>
            </CardHeader>
            <CardBody className="space-y-5">
              <div className="flex gap-4">
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-surface ring-1 ring-hair">
                  {vehicleImage(booking.vehicleId) ? (
                    <img src={vehicleImage(booking.vehicleId)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <Car className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-fg-strong">{vehicleTitle(booking.vehicleId) || '—'}</p>
                  {booking.vehicleId?.registrationNumber && (
                    <p className="font-mono text-sm text-muted">{booking.vehicleId.registrationNumber}</p>
                  )}
                </div>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailRow icon={MapPin} label="Pick-up">
                  {formatDateTime(booking.startAt)}
                </DetailRow>
                <DetailRow icon={MapPin} label="Return">
                  {formatDateTime(booking.endAt)}
                </DetailRow>
                <DetailRow icon={MapPin} label="Location">
                  {booking.locationId?.name || '—'}
                  {booking.locationId?.city ? `, ${booking.locationId.city}` : ''}
                </DetailRow>
                {booking.pricingBreakdown?.days != null && (
                  <DetailRow icon={MapPin} label="Duration">
                    {booking.pricingBreakdown.days} day{booking.pricingBreakdown.days === 1 ? '' : 's'}
                  </DetailRow>
                )}
              </dl>

              {booking.specialRequests && (
                <div className="rounded-lg border border-hair bg-surface/60 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Special requests</p>
                  <p className="text-sm text-fg">{booking.specialRequests}</p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-display text-lg font-semibold text-fg-strong">Customer</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-2 text-fg-strong">
                <UserIcon className="h-4 w-4 text-muted" />
                <span className="font-medium">{booking.customerId?.name || '—'}</span>
              </div>
              {booking.customerId?.email && (
                <a
                  href={`mailto:${booking.customerId.email}`}
                  className="flex items-center gap-2 text-sm text-fg transition-colors hover:text-signal"
                >
                  <Mail className="h-4 w-4 text-muted" />
                  {booking.customerId.email}
                </a>
              )}
              {booking.customerId?.phone && (
                <a
                  href={`tel:${booking.customerId.phone}`}
                  className="flex items-center gap-2 text-sm text-fg transition-colors hover:text-signal"
                >
                  <Phone className="h-4 w-4 text-muted" />
                  {booking.customerId.phone}
                </a>
              )}
            </CardBody>
          </Card>

          {status === BOOKING_STATUS.CANCELLED && booking.cancellation && (
            <Card className="border-red-500/30">
              <CardHeader>
                <h2 className="font-display text-lg font-semibold text-red-600 dark:text-red-400">Cancellation</h2>
              </CardHeader>
              <CardBody className="space-y-2 text-sm">
                {booking.cancellation.at && (
                  <p className="text-muted">Cancelled on {formatDateTime(booking.cancellation.at)}</p>
                )}
                {booking.cancellation.reason && <p className="text-fg">Reason: {booking.cancellation.reason}</p>}
                {booking.cancellation.refundAmount > 0 && (
                  <p className="text-fg">
                    Refund due: <span className="font-semibold">{formatMoney(booking.cancellation.refundAmount, currency)}</span>
                  </p>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* ── Right: pricing + payments ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-display text-lg font-semibold text-fg-strong">Price</h2>
            </CardHeader>
            <CardBody>
              <QuoteBreakdown quote={bookingToQuote(booking)} currency={currency} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-fg-strong">Payments</h2>
              <StatusBadge status={balanceQ.data?.paymentStatus || booking.paymentStatus} kind="payment" size="sm" />
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Paid" value={formatMoney(balanceQ.data?.amountPaid ?? booking.amountPaid, currency)} tone="success" />
                <Stat
                  label="Remaining"
                  value={formatMoney(
                    balanceQ.data?.amountRemaining ?? Math.max(0, (booking.totalAmount || 0) - (booking.amountPaid || 0)),
                    currency
                  )}
                  tone="warning"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setPayMode('record')} leftIcon={<Plus className="h-4 w-4" />}>
                  Record payment
                </Button>
                {isFinance && (
                  <Button size="sm" variant="ghost" onClick={() => setPayMode('refund')} leftIcon={<RotateCcw className="h-4 w-4" />}>
                    Refund
                  </Button>
                )}
              </div>

              <div className="border-t border-hair pt-3">
                {paymentsQ.isLoading ? (
                  <p className="text-sm text-muted">Loading ledger…</p>
                ) : paymentsQ.data?.length ? (
                  <ul className="divide-y divide-hair">
                    {paymentsQ.data.map((p) => {
                      const out = OUTFLOW_KINDS.has(p.kind);
                      return (
                        <li key={p._id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-fg-strong">
                              {PAYMENT_KIND_LABELS[p.kind] || p.kind}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {PAYMENT_METHOD_LABELS[p.method] || p.method} · {formatDate(p.paidAt || p.createdAt)}
                              {p.transactionRef ? ` · ${p.transactionRef}` : ''}
                            </p>
                          </div>
                          <span
                            className={
                              out
                                ? 'shrink-0 font-semibold tabular-nums text-red-600 dark:text-red-400'
                                : 'shrink-0 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            {out ? '−' : '+'}
                            {formatMoney(p.amount, currency)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center">
                    <Banknote className="mb-2 h-6 w-6 text-muted" />
                    <p className="text-sm text-muted">No payments recorded yet.</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        loading={cancelBooking.isPending}
        title="Cancel this booking?"
        description="The vehicle will be released for the selected dates. Any amount paid is recorded as refundable."
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
      >
        <Textarea
          label="Reason (optional)"
          rows={3}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="e.g. Customer requested cancellation"
          maxLength={500}
        />
      </ConfirmDialog>

      <PaymentDialog
        mode={payMode}
        onClose={() => setPayMode(null)}
        bookingId={id}
        currency={currency}
        remaining={balanceQ.data?.amountRemaining}
      />
    </>
  );
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
        <dd className="text-sm text-fg-strong">{children}</dd>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const toneClass = tone === 'success'
    ? 'text-emerald-600 dark:text-emerald-400'
    : tone === 'warning'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-fg-strong';
  return (
    <div className="rounded-lg border border-hair bg-surface/60 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

// Shared modal for recording a payment (money in) or a refund (money out).
function PaymentDialog({ mode, onClose, bookingId, currency, remaining }) {
  const open = !!mode;
  const isRefund = mode === 'refund';
  const toast = useToast();
  const recordPayment = useRecordPayment();
  const refundPayment = useRefundPayment();

  const kindOptions = isRefund ? PAYMENT_REFUND_KIND_OPTIONS : PAYMENT_INFLOW_KIND_OPTIONS;
  const [form, setForm] = useState({ amount: '', kind: '', method: 'CASH', transactionRef: '', notes: '' });

  useEffect(() => {
    if (open) {
      setForm({
        amount: !isRefund && remaining ? String(remaining) : '',
        kind: kindOptions[0].value,
        method: 'CASH',
        transactionRef: '',
        notes: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isRefund]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const mutation = isRefund ? refundPayment : recordPayment;

  const submit = async () => {
    const amount = Number(form.amount);
    if (!(amount > 0)) {
      toast.error('Enter an amount greater than zero');
      return;
    }
    const payload = { bookingId, amount, kind: form.kind, method: form.method };
    if (form.notes.trim()) payload.notes = form.notes.trim();
    if (!isRefund && form.transactionRef.trim()) payload.transactionRef = form.transactionRef.trim();
    try {
      await mutation.mutateAsync(payload);
      toast.success(isRefund ? 'Refund recorded' : 'Payment recorded');
      onClose();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isRefund ? 'Record refund' : 'Record payment'}
      description={isRefund ? 'Money returned to the customer.' : 'Money received from the customer.'}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={mutation.isPending}>
            {isRefund ? 'Record refund' : 'Record payment'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Amount"
          type="number"
          required
          min="0"
          step="0.01"
          value={form.amount}
          onChange={setField('amount')}
          leftIcon={<span className="text-sm">{currency === 'INR' ? '₹' : ''}</span>}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label="Type" options={kindOptions} value={form.kind} onChange={setField('kind')} />
          <Select label="Method" options={PAYMENT_METHOD_OPTIONS} value={form.method} onChange={setField('method')} />
        </div>
        {!isRefund && (
          <Input
            label="Reference"
            hint="Transaction / receipt no. (optional)"
            value={form.transactionRef}
            onChange={setField('transactionRef')}
          />
        )}
        <Textarea label="Notes" rows={2} value={form.notes} onChange={setField('notes')} maxLength={500} />
      </div>
    </Modal>
  );
}
