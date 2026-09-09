/**
 * Availability core — the pure, DB-free heart of the booking engine.
 *
 * Imports only zero-dependency constants. Every function here is deterministic
 * and unit-tested without a database, which is exactly what the correctness of
 * double-booking prevention depends on.
 */
const { VEHICLE_NON_BOOKABLE_STATUSES } = require('../config/constants');

const ms = (d) => new Date(d).getTime();

/**
 * Do intervals [aStart,aEnd] and [bStart,bEnd] conflict, given a required
 * separation `bufferMs`?
 *
 * They are FREE of conflict only when one ends at least `bufferMs` before the
 * other starts. Therefore:
 *
 *   conflict  ⇔  aStart < bEnd + buffer  AND  bStart < aEnd + buffer
 *
 * - buffer = 0  → touching endpoints do NOT conflict (same-day turnover allowed):
 *     [15→18] vs [18→20]  ⇒  no conflict
 * - buffer > 0  → touching/too-close bookings conflict (cleaning window enforced).
 * - overlapping ranges always conflict:
 *     [15→18] vs [17→20]  ⇒  conflict
 */
function hasConflict(aStart, aEnd, bStart, bEnd, bufferMs = 0) {
  const as = ms(aStart);
  const ae = ms(aEnd);
  const bs = ms(bStart);
  const be = ms(bEnd);
  return as < be + bufferMs && bs < ae + bufferMs;
}

/** A vehicle whose current status makes it entirely non-bookable (any dates). */
function isNonBookableStatus(status) {
  return VEHICLE_NON_BOOKABLE_STATUSES.includes(status);
}

/**
 * Given candidate vehicles and the blocking intervals (bookings + maintenance)
 * keyed by vehicle id, return the vehicles that are free for [start, end].
 *
 * @param {object} params
 * @param {Array<{_id:any,status:string}>} params.vehicles
 * @param {Map<string,Array<{start:Date,end:Date}>>|object} params.intervalsByVehicle
 * @param {Date} params.start
 * @param {Date} params.end
 * @param {number} [params.bufferMs=0]
 * @returns {Array} available vehicles (subset of input, same objects)
 */
function filterAvailable({ vehicles, intervalsByVehicle, start, end, bufferMs = 0 }) {
  const lookup = (id) => {
    if (intervalsByVehicle instanceof Map) return intervalsByVehicle.get(String(id)) || [];
    return (intervalsByVehicle && intervalsByVehicle[String(id)]) || [];
  };

  return vehicles.filter((v) => {
    if (isNonBookableStatus(v.status)) return false;
    const intervals = lookup(v._id);
    return !intervals.some((iv) => hasConflict(start, end, iv.start, iv.end, bufferMs));
  });
}

/** Convenience: is a single vehicle free given its own blocking intervals? */
function isVehicleAvailable({ status, intervals = [], start, end, bufferMs = 0 }) {
  if (isNonBookableStatus(status)) return false;
  return !intervals.some((iv) => hasConflict(start, end, iv.start, iv.end, bufferMs));
}

module.exports = { hasConflict, isNonBookableStatus, filterAvailable, isVehicleAvailable };
