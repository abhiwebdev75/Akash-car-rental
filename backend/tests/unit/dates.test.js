/**
 * Unit tests for the pure date/time helpers that drive availability & pricing.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  combineDateTime,
  hoursBetween,
  rentalDays,
  addMinutes,
  isValidDate,
  MS_PER_DAY,
} = require('../../src/utils/dates');

test('combineDateTime: merges a date and HH:mm into a UTC instant', () => {
  const d = combineDateTime('2026-09-09', '10:30');
  assert.equal(d.getUTCFullYear(), 2026);
  assert.equal(d.getUTCMonth(), 8); // September (0-indexed)
  assert.equal(d.getUTCDate(), 9);
  assert.equal(d.getUTCHours(), 10);
  assert.equal(d.getUTCMinutes(), 30);
});

test('combineDateTime: defaults to midnight when no time is given', () => {
  const d = combineDateTime('2026-09-09');
  assert.equal(d.getUTCHours(), 0);
  assert.equal(d.getUTCMinutes(), 0);
});

test('combineDateTime: throws on an invalid date', () => {
  assert.throws(() => combineDateTime('not-a-date', '10:00'), /invalid date/);
});

test('combineDateTime: throws on an out-of-range time', () => {
  assert.throws(() => combineDateTime('2026-09-09', '25:00'), /invalid time/);
});

test('rentalDays: any started 24h period counts as a full day, minimum 1', () => {
  const start = new Date('2026-01-10T10:00:00Z');
  assert.equal(rentalDays(start, new Date('2026-01-10T11:00:00Z')), 1); // 1 hour → 1 day
  assert.equal(rentalDays(start, new Date('2026-01-11T10:00:00Z')), 1); // exactly 24h → 1 day
  assert.equal(rentalDays(start, new Date('2026-01-11T10:00:01Z')), 2); // just over 24h → 2 days
  assert.equal(rentalDays(start, new Date('2026-01-13T10:00:00Z')), 3); // 3 days
});

test('rentalDays: returns 0 for a non-positive range so callers can reject it', () => {
  const start = new Date('2026-01-10T10:00:00Z');
  assert.equal(rentalDays(start, start), 0);
  assert.equal(rentalDays(start, new Date('2026-01-09T10:00:00Z')), 0);
});

test('hoursBetween: computes fractional hours', () => {
  assert.equal(hoursBetween('2026-01-10T10:00:00Z', '2026-01-10T13:30:00Z'), 3.5);
});

test('addMinutes: shifts an instant forward', () => {
  const d = addMinutes(new Date('2026-01-10T10:00:00Z'), 90);
  assert.equal(d.toISOString(), '2026-01-10T11:30:00.000Z');
});

test('isValidDate: distinguishes valid from invalid input', () => {
  assert.equal(isValidDate('2026-09-09'), true);
  assert.equal(isValidDate('nope'), false);
});

test('MS_PER_DAY constant is correct', () => {
  assert.equal(MS_PER_DAY, 24 * 60 * 60 * 1000);
});
