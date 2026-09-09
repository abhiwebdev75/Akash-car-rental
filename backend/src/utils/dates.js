/**
 * Pure date/time helpers used by the availability and pricing engines.
 * No timezone library is needed: date + "HH:mm" are combined into a UTC instant
 * deterministically. Clients send dates in ISO or business-local form; the
 * canonical `startAt`/`endAt` instants drive all overlap math.
 */
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Combine a date (Date | ISO string | yyyy-mm-dd) and a "HH:mm" time into a
 * single UTC Date instant.
 */
function combineDateTime(date, time = '00:00') {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`combineDateTime: invalid date "${date}"`);
  }
  const [hStr = '0', mStr = '0'] = String(time).split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`combineDateTime: invalid time "${time}"`);
  }
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, m, 0, 0)
  );
}

/** Whole hours between two instants (can be fractional -> rounded down here). */
function hoursBetween(startAt, endAt) {
  return (new Date(endAt).getTime() - new Date(startAt).getTime()) / MS_PER_HOUR;
}

/**
 * Billable rental days: any started 24h period counts as a full day, minimum 1.
 * Returns 0 for a non-positive range so callers can treat it as invalid.
 */
function rentalDays(startAt, endAt) {
  const ms = new Date(endAt).getTime() - new Date(startAt).getTime();
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / MS_PER_DAY));
}

function addMinutes(date, minutes) {
  return new Date(new Date(date).getTime() + minutes * MS_PER_MINUTE);
}

/** True when `value` is a valid, parseable date. */
function isValidDate(value) {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

module.exports = {
  MS_PER_MINUTE,
  MS_PER_HOUR,
  MS_PER_DAY,
  combineDateTime,
  hoursBetween,
  rentalDays,
  addMinutes,
  isValidDate,
};
