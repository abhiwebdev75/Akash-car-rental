// Date helpers for form inputs and range math. These manipulate dates the user
// picks; they never compute billable days or money — the backend quote is the
// source of truth for anything charged (see pricing engine).

/** yyyy-mm-dd for today, in local time. */
export function todayInput() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** Add n days to a yyyy-mm-dd string, returning yyyy-mm-dd (local). */
export function addDays(dateStr, n) {
  const d = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  d.setDate(d.getDate() + n);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/**
 * Combine a yyyy-mm-dd date and an HH:mm time (local) into an ISO string, for
 * the availability/quote APIs which expect ISO instants. Returns null if either
 * part is missing/invalid.
 */
export function combineDateTimeISO(dateStr, timeStr = '10:00') {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T${timeStr || '10:00'}:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** True when the end instant is strictly after the start instant. */
export function isValidRange(startDate, startTime, endDate, endTime) {
  const s = combineDateTimeISO(startDate, startTime);
  const e = combineDateTimeISO(endDate, endTime);
  if (!s || !e) return false;
  return new Date(e).getTime() > new Date(s).getTime();
}
