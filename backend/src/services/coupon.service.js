/**
 * Coupon service. `checkCouponValidity` is pure (no DB) so it can be unit
 * tested; the Coupon model is lazy-required inside the DB-backed helpers.
 * All coupon rules are enforced on the backend.
 */
const ApiError = require('../utils/ApiError');

/**
 * Pure validity check against a rental subtotal at a point in time.
 * @returns {{ valid:boolean, reason?:string }}
 */
function checkCouponValidity(coupon, { subtotal = 0, now = Date.now() } = {}) {
  if (!coupon || !coupon.active) return { valid: false, reason: 'Coupon is not valid' };

  const t = new Date(now).getTime();
  if (coupon.startDate && t < new Date(coupon.startDate).getTime()) {
    return { valid: false, reason: 'Coupon is not active yet' };
  }
  if (coupon.endDate && t > new Date(coupon.endDate).getTime()) {
    return { valid: false, reason: 'Coupon has expired' };
  }
  if (coupon.usageLimit != null && (coupon.usedCount || 0) >= coupon.usageLimit) {
    return { valid: false, reason: 'Coupon usage limit reached' };
  }
  if (coupon.minimumRental && subtotal < coupon.minimumRental) {
    return { valid: false, reason: `Minimum rental of ${coupon.minimumRental} required for this coupon` };
  }
  return { valid: true };
}

/**
 * Look up a coupon by code and validate it against a subtotal. Throws a 400
 * ApiError with the reason if invalid; returns the coupon document if valid.
 */
async function validateCode(code, subtotal) {
  if (!code) return null;
  const Coupon = require('../models/Coupon');
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase() });
  if (!coupon) throw ApiError.badRequest('Invalid coupon code');

  const { valid, reason } = checkCouponValidity(coupon, { subtotal });
  if (!valid) throw ApiError.badRequest(reason);
  return coupon;
}

/** Atomically increment a coupon's redemption count (call after booking). */
async function redeem(couponId, session = null) {
  if (!couponId) return;
  const Coupon = require('../models/Coupon');
  await Coupon.updateOne({ _id: couponId }, { $inc: { usedCount: 1 } }, { session });
}

module.exports = { checkCouponValidity, validateCode, redeem };
