/**
 * Unit tests for the availability core — the pure, DB-free heart of
 * double-booking prevention. These are the most important tests in the suite:
 * if overlap math is wrong, the whole platform can double-book a vehicle.
 *
 * Run with: npm run test:unit   (node --test)
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  hasConflict,
  isNonBookableStatus,
  filterAvailable,
  isVehicleAvailable,
} = require('../../src/services/availability.core');
const { VEHICLE_STATUS } = require('../../src/config/constants');

// Helper: build a Date from an hour-of-day on a fixed reference day (UTC).
const H = (hour) => new Date(Date.UTC(2026, 0, 1, hour, 0, 0));
const MIN = 60 * 1000;

test('hasConflict: overlapping ranges conflict', () => {
  // [15→18] vs [17→20] overlap by an hour.
  assert.equal(hasConflict(H(15), H(18), H(17), H(20)), true);
});

test('hasConflict: identical ranges conflict', () => {
  assert.equal(hasConflict(H(10), H(14), H(10), H(14)), true);
});

test('hasConflict: fully contained range conflicts', () => {
  assert.equal(hasConflict(H(10), H(20), H(12), H(14)), true);
});

test('hasConflict: disjoint ranges do not conflict', () => {
  assert.equal(hasConflict(H(10), H(12), H(14), H(16)), false);
});

test('hasConflict: touching endpoints do NOT conflict when buffer is 0 (same-day turnover)', () => {
  // Car returned at 18:00 can be picked up by the next renter at 18:00.
  assert.equal(hasConflict(H(15), H(18), H(18), H(20), 0), false);
  assert.equal(hasConflict(H(18), H(20), H(15), H(18), 0), false);
});

test('hasConflict: touching endpoints DO conflict when a turnover buffer is required', () => {
  // With a 60-minute cleaning buffer, back-to-back at 18:00 is too close.
  assert.equal(hasConflict(H(15), H(18), H(18), H(20), 60 * MIN), true);
});

test('hasConflict: a gap larger than the buffer is free', () => {
  // 18:00 → 19:00 is a 60-min gap; a 30-min buffer is satisfied.
  assert.equal(hasConflict(H(15), H(18), H(19), H(20), 30 * MIN), false);
});

test('hasConflict is symmetric in its two intervals', () => {
  const a = [H(9), H(12)];
  const b = [H(11), H(13)];
  assert.equal(
    hasConflict(...a, ...b),
    hasConflict(...b, ...a)
  );
});

test('isNonBookableStatus: MAINTENANCE and INACTIVE are non-bookable; AVAILABLE is bookable', () => {
  assert.equal(isNonBookableStatus(VEHICLE_STATUS.MAINTENANCE), true);
  assert.equal(isNonBookableStatus(VEHICLE_STATUS.INACTIVE), true);
  assert.equal(isNonBookableStatus(VEHICLE_STATUS.AVAILABLE), false);
  assert.equal(isNonBookableStatus(VEHICLE_STATUS.RENTED), false);
});

test('isVehicleAvailable: free vehicle with no intervals is available', () => {
  assert.equal(
    isVehicleAvailable({ status: VEHICLE_STATUS.AVAILABLE, intervals: [], start: H(10), end: H(12) }),
    true
  );
});

test('isVehicleAvailable: conflicting interval makes it unavailable', () => {
  assert.equal(
    isVehicleAvailable({
      status: VEHICLE_STATUS.AVAILABLE,
      intervals: [{ start: H(11), end: H(13) }],
      start: H(10),
      end: H(12),
    }),
    false
  );
});

test('isVehicleAvailable: MAINTENANCE status is never available regardless of dates', () => {
  assert.equal(
    isVehicleAvailable({ status: VEHICLE_STATUS.MAINTENANCE, intervals: [], start: H(10), end: H(12) }),
    false
  );
});

test('filterAvailable: excludes vehicles with a conflicting interval (object map)', () => {
  const vehicles = [
    { _id: 'a', status: VEHICLE_STATUS.AVAILABLE },
    { _id: 'b', status: VEHICLE_STATUS.AVAILABLE },
  ];
  const intervalsByVehicle = {
    a: [{ start: H(11), end: H(13) }], // conflicts with 10→12
    b: [{ start: H(14), end: H(16) }], // free at 10→12
  };
  const free = filterAvailable({ vehicles, intervalsByVehicle, start: H(10), end: H(12) });
  assert.deepEqual(free.map((v) => v._id), ['b']);
});

test('filterAvailable: works with a Map keyed by string id', () => {
  const vehicles = [{ _id: 1, status: VEHICLE_STATUS.AVAILABLE }];
  const intervalsByVehicle = new Map([['1', [{ start: H(11), end: H(13) }]]]);
  const free = filterAvailable({ vehicles, intervalsByVehicle, start: H(10), end: H(12) });
  assert.equal(free.length, 0);
});

test('filterAvailable: excludes MAINTENANCE/INACTIVE vehicles even with no intervals', () => {
  const vehicles = [
    { _id: 'a', status: VEHICLE_STATUS.MAINTENANCE },
    { _id: 'b', status: VEHICLE_STATUS.INACTIVE },
    { _id: 'c', status: VEHICLE_STATUS.AVAILABLE },
  ];
  const free = filterAvailable({ vehicles, intervalsByVehicle: {}, start: H(10), end: H(12) });
  assert.deepEqual(free.map((v) => v._id), ['c']);
});

test('filterAvailable: same-day turnover — a vehicle returning exactly at pickup time is available (buffer 0)', () => {
  const vehicles = [{ _id: 'a', status: VEHICLE_STATUS.AVAILABLE }];
  const intervalsByVehicle = { a: [{ start: H(8), end: H(10) }] };
  const free = filterAvailable({ vehicles, intervalsByVehicle, start: H(10), end: H(12), bufferMs: 0 });
  assert.equal(free.length, 1);
});

// ── The §56 critical double-booking scenario, end to end (pure) ──────────────
test('CRITICAL (§56): a second booking overlapping a CONFIRMED booking must be rejected', () => {
  // Existing confirmed booking holds vehicle X from Jan 10 10:00 → Jan 13 10:00.
  const existing = { start: new Date('2026-01-10T10:00:00Z'), end: new Date('2026-01-13T10:00:00Z') };

  // Attempt 1: fully overlapping request (Jan 11 → Jan 12) — MUST be unavailable.
  assert.equal(
    isVehicleAvailable({
      status: VEHICLE_STATUS.AVAILABLE,
      intervals: [existing],
      start: new Date('2026-01-11T10:00:00Z'),
      end: new Date('2026-01-12T10:00:00Z'),
    }),
    false,
    'overlapping request must be rejected'
  );

  // Attempt 2: partial overlap at the tail (Jan 12 → Jan 15) — MUST be unavailable.
  assert.equal(
    isVehicleAvailable({
      status: VEHICLE_STATUS.AVAILABLE,
      intervals: [existing],
      start: new Date('2026-01-12T10:00:00Z'),
      end: new Date('2026-01-15T10:00:00Z'),
    }),
    false,
    'partially overlapping request must be rejected'
  );

  // Attempt 3: starts exactly when the existing ends (Jan 13 10:00 → Jan 15) —
  // allowed with same-day turnover (buffer 0).
  assert.equal(
    isVehicleAvailable({
      status: VEHICLE_STATUS.AVAILABLE,
      intervals: [existing],
      start: new Date('2026-01-13T10:00:00Z'),
      end: new Date('2026-01-15T10:00:00Z'),
      bufferMs: 0,
    }),
    true,
    'back-to-back booking at the exact return instant is allowed with no buffer'
  );
});
