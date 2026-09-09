/**
 * Unit tests for the pure booking/agreement number formatter.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const { format } = require('../../src/services/bookingNumber.service');

test('format: zero-pads the sequence to 6 digits by default', () => {
  assert.equal(format('CR', 2026, 1), 'CR-2026-000001');
  assert.equal(format('CR', 2026, 42), 'CR-2026-000042');
});

test('format: agreement prefix with a custom pad width', () => {
  assert.equal(format('AGR', 2026, 123, 6), 'AGR-2026-000123');
  assert.equal(format('AGR', 2026, 7, 4), 'AGR-2026-0007');
});

test('format: does not truncate sequences longer than the pad width', () => {
  assert.equal(format('CR', 2026, 1234567), 'CR-2026-1234567');
});
