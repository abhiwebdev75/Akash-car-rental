/**
 * Booking / agreement number generation.
 *
 * `format` is pure and unit-tested. `nextBookingNumber` / `nextAgreementNumber`
 * use the atomic Counter (lazy-required so the pure formatter can be imported
 * without loading Mongoose). Numbers are unique and monotonically increasing
 * per year, e.g. CR-2026-000001.
 */

/** Pure: build a zero-padded reference like "CR-2026-000001". */
function format(prefix, year, seq, pad = 6) {
  return `${prefix}-${year}-${String(seq).padStart(pad, '0')}`;
}

async function nextBookingNumber(date = new Date(), session = null) {
  const Counter = require('../models/Counter');
  const year = new Date(date).getUTCFullYear();
  const seq = await Counter.next(`booking-${year}`, session);
  return format('CR', year, seq);
}

async function nextAgreementNumber(date = new Date(), session = null) {
  const Counter = require('../models/Counter');
  const year = new Date(date).getUTCFullYear();
  const seq = await Counter.next(`agreement-${year}`, session);
  return format('AGR', year, seq);
}

module.exports = { format, nextBookingNumber, nextAgreementNumber };
