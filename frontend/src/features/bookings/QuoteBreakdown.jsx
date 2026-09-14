import { formatMoney, pluralize } from '../../lib/formatters';
import { cn } from '../../lib/cn';

export function QuoteBreakdown({ quote, currency = 'INR', className }) {
  if (!quote) return null;
  const {
    days,
    base,
    addOns = [],
    addOnsTotal = 0,
    subtotal = 0,
    discount = 0,
    taxRate = 0,
    tax = 0,
    total = 0,
    securityDeposit = 0,
    grandTotalDueAtPickup,
  } = quote;

  return (
    <div className={cn('text-sm', className)}>
      <Row label={`Base rental${days ? ` · ${pluralize(days, 'day')}` : ''}`} value={formatMoney(base, currency)} />

      {addOns.length > 0 && (
        <div className="mt-1 space-y-1 border-l-2 border-hair pl-3">
          {addOns.map((a) => (
            <Row
              key={a.addOnId}
              muted
              label={`${a.name}${a.quantity > 1 ? ` × ${a.quantity}` : ''}`}
              value={formatMoney(a.lineTotal, currency)}
            />
          ))}
        </div>
      )}

      <div className="my-3 h-px bg-hair" />

      <Row label="Subtotal" value={formatMoney(subtotal, currency)} />
      {discount > 0 && (
        <Row
          label="Discount"
          value={`− ${formatMoney(discount, currency)}`}
          className="text-route-700 dark:text-route-300"
        />
      )}
      <Row label={`Tax${taxRate ? ` (${taxRate}%)` : ''}`} value={formatMoney(tax, currency)} />

      <div className="my-3 h-px bg-hair" />

      <Row
        strong
        label="Total"
        value={formatMoney(total, currency)}
      />

      {securityDeposit > 0 && (
        <Row
          muted
          className="mt-2"
          label="Refundable deposit"
          value={formatMoney(securityDeposit, currency)}
        />
      )}

      {typeof grandTotalDueAtPickup === 'number' && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-signal/10 px-3 py-2.5">
          <span className="text-sm font-semibold text-fg-strong">Due at pickup</span>
          <span className="text-base font-bold text-fg-strong">
            {formatMoney(grandTotalDueAtPickup, currency)}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Adapt a persisted booking (from GET /bookings/:id) into the same shape
 * QuoteBreakdown renders. Every value is read straight off the stored booking —
 * nothing is recomputed. `grandTotalDueAtPickup` is intentionally omitted: for a
 * saved booking we show payment state separately, not a "due at pickup" figure.
 */
export function bookingToQuote(booking) {
  if (!booking) return null;
  const pb = booking.pricingBreakdown || {};
  return {
    days: pb.days,
    base: pb.base,
    addOns: booking.addOns || [],
    addOnsTotal: pb.addOnsTotal || 0,
    subtotal: pb.subtotal || 0,
    discount: booking.discount || 0,
    taxRate: booking.taxRate || 0,
    tax: booking.tax || 0,
    total: booking.totalAmount || 0,
    securityDeposit: booking.securityDeposit || 0,
  };
}

function Row({ label, value, strong, muted, className }) {
  return (
    <div className={cn('flex items-center justify-between py-0.5', className)}>
      <span className={cn(muted ? 'text-muted' : 'text-fg', strong && 'font-semibold text-fg-strong')}>
        {label}
      </span>
      <span className={cn('tabular-nums', strong ? 'text-lg font-bold text-fg-strong' : muted ? 'text-muted' : 'text-fg')}>
        {value}
      </span>
    </div>
  );
}
