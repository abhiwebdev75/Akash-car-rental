// Display formatting helpers. NONE of these compute trusted money — prices,
// discounts, taxes and totals always come from the backend pricing engine.
// These only format values the server already calculated.

const LOCALE_BY_CURRENCY = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
  AED: 'en-AE',
};

function toDate(input) {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Format an amount the server computed, using the business's configured currency. */
export function formatMoney(amount, currency = 'INR') {
  const value = Number(amount) || 0;
  const locale = LOCALE_BY_CURRENCY[currency] || 'en-IN';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString(locale)}`;
  }
}

export function formatDate(input, opts) {
  const d = toDate(input);
  if (!d) return '';
  return new Intl.DateTimeFormat(
    'en-IN',
    opts || { day: 'numeric', month: 'short', year: 'numeric' }
  ).format(d);
}

export function formatDateTime(input) {
  const d = toDate(input);
  if (!d) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** "HH:mm" (24h) → friendly 12h label, e.g. "10:00" → "10:00 AM". */
export function formatTime(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return '';
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
}

export function formatDateRange(start, end) {
  const s = formatDate(start);
  const e = formatDate(end);
  return s && e ? `${s} – ${e}` : s || e;
}

/** Whole calendar days between two dates (display only; billable days come from the quote). */
export function daysBetween(start, end) {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return 0;
  return Math.max(0, Math.ceil((e.getTime() - s.getTime()) / 86_400_000));
}

/** yyyy-mm-dd for <input type="date"> values, in local time. */
export function toDateInputValue(input) {
  const d = toDate(input) || new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || '?';
}

export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural || `${singular}s`}`;
}

/** ENUM_VALUE → "Enum value" for any label we don't have an explicit map for. */
export function titleCase(str = '') {
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/(^|\s)\w/g, (c) => c.toUpperCase());
}
