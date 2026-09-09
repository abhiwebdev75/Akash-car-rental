/**
 * Unit tests for coupon validity (pure rules; DB lookups tested separately).
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const { checkCouponValidity } = require('../../src/services/coupon.service');
const { COUPON_TYPE } = require('../../src/config/constants');

const NOW = new Date('2026-06-15T00:00:00Z').getTime();
const base = {
  code: 'SAVE10',
  type: COUPON_TYPE.PERCENTAGE,
  value: 10,
  active: true,
  startDate: new Date('2026-06-01T00:00:00Z'),
  endDate: new Date('2026-06-30T00:00:00Z'),
  minimumRental: 2000,
  usedCount: 0,
};

test('valid coupon within window and above minimum passes', () => {
  const r = checkCouponValidity(base, { subtotal: 3000, now: NOW });
  assert.equal(r.valid, true);
});

test('inactive coupon is rejected', () => {
  const r = checkCouponValidity({ ...base, active: false }, { subtotal: 3000, now: NOW });
  assert.equal(r.valid, false);
  assert.match(r.reason, /not valid/i);
});

test('null coupon is rejected', () => {
  const r = checkCouponValidity(null, { subtotal: 3000, now: NOW });
  assert.equal(r.valid, false);
});

test('coupon not yet active is rejected', () => {
  const early = new Date('2026-05-01T00:00:00Z').getTime();
  const r = checkCouponValidity(base, { subtotal: 3000, now: early });
  assert.equal(r.valid, false);
  assert.match(r.reason, /not active yet/i);
});

test('expired coupon is rejected', () => {
  const late = new Date('2026-07-01T00:00:00Z').getTime();
  const r = checkCouponValidity(base, { subtotal: 3000, now: late });
  assert.equal(r.valid, false);
  assert.match(r.reason, /expired/i);
});

test('coupon at its usage limit is rejected', () => {
  const r = checkCouponValidity({ ...base, usageLimit: 5, usedCount: 5 }, { subtotal: 3000, now: NOW });
  assert.equal(r.valid, false);
  assert.match(r.reason, /usage limit/i);
});

test('subtotal below the minimum rental is rejected', () => {
  const r = checkCouponValidity(base, { subtotal: 1000, now: NOW });
  assert.equal(r.valid, false);
  assert.match(r.reason, /[Mm]inimum rental/);
});

test('coupon with no window/limits is always valid', () => {
  const r = checkCouponValidity({ active: true, type: COUPON_TYPE.FIXED, value: 100 }, { subtotal: 0 });
  assert.equal(r.valid, true);
});
