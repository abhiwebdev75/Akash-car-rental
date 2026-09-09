/**
 * Pricing engine — the single trusted source for money math.
 *
 * This module is intentionally PURE: it imports only zero-dependency helpers
 * (constants, date utils) and never touches the database, environment, or
 * network. All inputs (vehicle prices, tax rate, coupon, add-ons) are passed in.
 * That keeps pricing deterministic and fully unit-testable without a DB.
 *
 * Never compute a trusted price on the frontend — always call this on the server.
 */
const { ADDON_PRICING_TYPE, COUPON_TYPE } = require('../config/constants');
const { rentalDays, hoursBetween } = require('../utils/dates');

/** Round to 2 decimal places, avoiding binary float drift. */
function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Compute the base rental cost for `days` days, choosing the cheapest of the
 * plain daily rate and a tiered (month/week/day) breakdown. Weekly/monthly
 * tiers are only used when configured (> 0).
 *
 * @returns {{ base:number, strategy:'DAILY'|'TIERED', days:number }}
 */
function computeBaseRental(vehicle, days) {
  const daily = Number(vehicle.dailyPrice) || 0;
  const weekly = Number(vehicle.weeklyPrice) || 0;
  const monthly = Number(vehicle.monthlyPrice) || 0;

  const dailyOnly = daily * days;

  // Tiered: consume months, then weeks, then leftover days.
  let remaining = days;
  const months = monthly > 0 ? Math.floor(remaining / 30) : 0;
  remaining -= months * 30;
  const weeks = weekly > 0 ? Math.floor(remaining / 7) : 0;
  remaining -= weeks * 7;
  const tiered = months * monthly + weeks * weekly + remaining * daily;

  const useTiered = (weekly > 0 || monthly > 0) && tiered < dailyOnly;
  return {
    base: round2(useTiered ? tiered : dailyOnly),
    strategy: useTiered ? 'TIERED' : 'DAILY',
    days,
  };
}

/**
 * Price a list of selected add-ons.
 * @param {Array<{addOnId?,name?,pricingType,unitPrice,quantity?}>} addOns
 * @returns {{ lines:Array, total:number }}
 */
function computeAddOns(addOns = [], days = 1) {
  const lines = addOns.map((a) => {
    const qty = Math.max(1, Number(a.quantity) || 1);
    const unit = Number(a.unitPrice) || 0;
    let lineTotal;
    switch (a.pricingType) {
      case ADDON_PRICING_TYPE.PER_DAY:
        lineTotal = unit * days * qty;
        break;
      case ADDON_PRICING_TYPE.PER_UNIT:
      case ADDON_PRICING_TYPE.PER_RENTAL:
      default:
        lineTotal = unit * qty;
        break;
    }
    return {
      addOnId: a.addOnId,
      name: a.name,
      pricingType: a.pricingType,
      unitPrice: unit,
      quantity: qty,
      lineTotal: round2(lineTotal),
    };
  });
  const total = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  return { lines, total };
}

/**
 * Compute the discount a (already-validated) coupon yields on `amount`.
 * Percentage coupons respect `maximumDiscount`; discount never exceeds `amount`.
 */
function computeCouponDiscount(coupon, amount) {
  if (!coupon) return 0;
  let discount = 0;
  if (coupon.type === COUPON_TYPE.PERCENTAGE) {
    discount = (amount * Number(coupon.value)) / 100;
    if (coupon.maximumDiscount != null) {
      discount = Math.min(discount, Number(coupon.maximumDiscount));
    }
  } else if (coupon.type === COUPON_TYPE.FIXED) {
    discount = Number(coupon.value);
  }
  return round2(Math.max(0, Math.min(discount, amount)));
}

/**
 * Produce a full, trusted price quote.
 *
 * @param {object}   params
 * @param {object}   params.vehicle       vehicle with pricing fields
 * @param {Date}     [params.startAt]      canonical start (if days not given)
 * @param {Date}     [params.endAt]        canonical end
 * @param {number}   [params.days]         explicit billable days (overrides dates)
 * @param {Array}    [params.addOns]       selected add-ons (priced form)
 * @param {object}   [params.coupon]       validated coupon or null
 * @param {number}   [params.manualDiscount] extra flat discount
 * @param {number}   [params.taxRate]      fraction, e.g. 0.18
 * @returns {object} full breakdown
 */
function quote({
  vehicle,
  startAt,
  endAt,
  days,
  addOns = [],
  coupon = null,
  manualDiscount = 0,
  taxRate = 0,
}) {
  const billableDays = days != null ? days : rentalDays(startAt, endAt);
  if (!billableDays || billableDays < 1) {
    throw new Error('quote: rental duration must be at least 1 day');
  }

  const { base, strategy } = computeBaseRental(vehicle, billableDays);
  const addOnsResult = computeAddOns(addOns, billableDays);
  const subtotal = round2(base + addOnsResult.total);

  const couponDiscount = computeCouponDiscount(coupon, subtotal);
  const discount = round2(Math.min(subtotal, couponDiscount + (Number(manualDiscount) || 0)));

  const taxable = round2(subtotal - discount);
  const tax = round2(taxable * (Number(taxRate) || 0));
  const total = round2(taxable + tax);
  const securityDeposit = round2(Number(vehicle.securityDeposit) || 0);

  return {
    days: billableDays,
    baseStrategy: strategy,
    base,
    addOns: addOnsResult.lines,
    addOnsTotal: addOnsResult.total,
    subtotal,
    discount,
    taxRate: Number(taxRate) || 0,
    tax,
    total, // rental total incl. tax, excludes refundable deposit
    securityDeposit,
    grandTotalDueAtPickup: round2(total + securityDeposit),
  };
}

// ── Return-time charges (computed by the inspection service) ────────────────

/** Extra-kilometre charge based on the allowance for the rental duration. */
function computeExtraKmCharge(vehicle, kmDriven, days) {
  const perDay = Number(vehicle.kmPerDayAllowance) || 0;
  if (perDay <= 0) return { extraKm: 0, charge: 0 }; // 0 => unlimited km
  const allowance = perDay * days;
  const extraKm = Math.max(0, kmDriven - allowance);
  return { extraKm, charge: round2(extraKm * (Number(vehicle.extraKmPrice) || 0)) };
}

/** Late-return fee: whole hours late × per-hour fee. */
function computeLateFee(scheduledEndAt, actualReturnAt, lateFeePerHour) {
  const hoursLate = hoursBetween(scheduledEndAt, actualReturnAt);
  if (hoursLate <= 0) return { hoursLate: 0, charge: 0 };
  const billableHours = Math.ceil(hoursLate);
  return { hoursLate: billableHours, charge: round2(billableHours * (Number(lateFeePerHour) || 0)) };
}

/** Fuel shortfall charge: units below pickup level × per-unit charge. */
function computeFuelCharge(pickupFuelLevel, returnFuelLevel, fuelChargePerUnit) {
  const shortfall = Math.max(0, (Number(pickupFuelLevel) || 0) - (Number(returnFuelLevel) || 0));
  return { shortfall, charge: round2(shortfall * (Number(fuelChargePerUnit) || 0)) };
}

module.exports = {
  round2,
  computeBaseRental,
  computeAddOns,
  computeCouponDiscount,
  quote,
  computeExtraKmCharge,
  computeLateFee,
  computeFuelCharge,
};
