/**
 * Unit tests for the pricing engine — the single trusted source of money math.
 * Pure and DB-free, so every rule is verified deterministically.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  round2,
  computeBaseRental,
  computeAddOns,
  computeCouponDiscount,
  quote,
} = require('../../src/services/pricing.service');
const { ADDON_PRICING_TYPE, COUPON_TYPE } = require('../../src/config/constants');

test('round2 avoids binary float drift', () => {
  assert.equal(round2(0.1 + 0.2), 0.3);
  assert.equal(round2(3800 * 0.18), 684);
});

test('computeBaseRental: daily strategy when no tiers configured', () => {
  const r = computeBaseRental({ dailyPrice: 1000 }, 5);
  assert.equal(r.base, 5000);
  assert.equal(r.strategy, 'DAILY');
});

test('computeBaseRental: uses the cheaper tiered price when a weekly rate helps', () => {
  // 7 days: daily=7000 vs weekly bundle=6000 → tiered wins.
  const r = computeBaseRental({ dailyPrice: 1000, weeklyPrice: 6000 }, 7);
  assert.equal(r.base, 6000);
  assert.equal(r.strategy, 'TIERED');
});

test('computeBaseRental: 10 days = 1 week + 3 days at the tiered rate', () => {
  const r = computeBaseRental({ dailyPrice: 1000, weeklyPrice: 6000 }, 10);
  assert.equal(r.base, 9000); // 6000 + 3*1000
  assert.equal(r.strategy, 'TIERED');
});

test('computeBaseRental: daily wins when the weekly rate is not actually cheaper', () => {
  const r = computeBaseRental({ dailyPrice: 1000, weeklyPrice: 9000 }, 7);
  assert.equal(r.base, 7000);
  assert.equal(r.strategy, 'DAILY');
});

test('computeAddOns: PER_DAY multiplies by days and quantity; PER_RENTAL does not', () => {
  const { lines, total } = computeAddOns(
    [
      { addOnId: 'x', name: 'Child Seat', pricingType: ADDON_PRICING_TYPE.PER_DAY, unitPrice: 100, quantity: 2 },
      { addOnId: 'y', name: 'GPS', pricingType: ADDON_PRICING_TYPE.PER_RENTAL, unitPrice: 300, quantity: 1 },
    ],
    3
  );
  assert.equal(lines[0].lineTotal, 600); // 100 * 3 days * 2
  assert.equal(lines[1].lineTotal, 300); // flat per rental
  assert.equal(total, 900);
});

test('computeAddOns: empty list totals zero', () => {
  assert.deepEqual(computeAddOns([], 5), { lines: [], total: 0 });
});

test('computeCouponDiscount: percentage respects the maximum-discount cap', () => {
  assert.equal(computeCouponDiscount({ type: COUPON_TYPE.PERCENTAGE, value: 10, maximumDiscount: 1500 }, 3800), 380);
  assert.equal(computeCouponDiscount({ type: COUPON_TYPE.PERCENTAGE, value: 50, maximumDiscount: 1000 }, 3800), 1000);
});

test('computeCouponDiscount: fixed coupon never exceeds the amount', () => {
  assert.equal(computeCouponDiscount({ type: COUPON_TYPE.FIXED, value: 500 }, 3800), 500);
  assert.equal(computeCouponDiscount({ type: COUPON_TYPE.FIXED, value: 5000 }, 3800), 3800);
});

test('computeCouponDiscount: no coupon yields zero', () => {
  assert.equal(computeCouponDiscount(null, 3800), 0);
});

test('quote: full breakdown with add-ons, no coupon, 18% tax', () => {
  const vehicle = { dailyPrice: 1000, securityDeposit: 5000 };
  const q = quote({
    vehicle,
    startAt: new Date('2026-01-10T10:00:00Z'),
    endAt: new Date('2026-01-13T10:00:00Z'), // 3 days
    addOns: [
      { pricingType: ADDON_PRICING_TYPE.PER_DAY, unitPrice: 100, quantity: 1 },
      { pricingType: ADDON_PRICING_TYPE.PER_RENTAL, unitPrice: 500, quantity: 1 },
    ],
    taxRate: 0.18,
  });
  assert.equal(q.days, 3);
  assert.equal(q.base, 3000);
  assert.equal(q.addOnsTotal, 800); // 300 + 500
  assert.equal(q.subtotal, 3800);
  assert.equal(q.discount, 0);
  assert.equal(q.tax, 684); // 3800 * 0.18
  assert.equal(q.total, 4484);
  assert.equal(q.securityDeposit, 5000);
  assert.equal(q.grandTotalDueAtPickup, 9484); // total + refundable deposit
});

test('quote: coupon discount is applied before tax', () => {
  const vehicle = { dailyPrice: 1000, securityDeposit: 0 };
  const q = quote({
    vehicle,
    days: 4,
    coupon: { type: COUPON_TYPE.PERCENTAGE, value: 10, maximumDiscount: 1500 },
    taxRate: 0.18,
  });
  // base 4000, subtotal 4000, discount 400, taxable 3600, tax 648, total 4248
  assert.equal(q.subtotal, 4000);
  assert.equal(q.discount, 400);
  assert.equal(q.tax, 648);
  assert.equal(q.total, 4248);
});

test('quote: throws on a non-positive duration (backend must reject bad ranges)', () => {
  assert.throws(
    () => quote({ vehicle: { dailyPrice: 1000 }, days: 0, taxRate: 0 }),
    /at least 1 day/
  );
});
