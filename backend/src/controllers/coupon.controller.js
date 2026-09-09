/**
 * Coupon controller. Admins manage coupons; any authenticated user can preview
 * a code against a subtotal (the same server-side rules that apply at booking).
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Coupon = require('../models/Coupon');
const couponService = require('../services/coupon.service');
const { computeCouponDiscount } = require('../services/pricing.service');

const list = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  return sendSuccess(res, coupons);
});

const create = asyncHandler(async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    return sendCreated(res, coupon, { message: 'Coupon created' });
  } catch (err) {
    if (err && err.code === 11000) throw ApiError.conflict('A coupon with that code already exists');
    throw err;
  }
});

const getById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return sendSuccess(res, coupon);
});

const update = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return sendSuccess(res, coupon, { message: 'Coupon updated' });
});

const remove = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return sendSuccess(res, { id: req.params.id }, { message: 'Coupon deleted' });
});

/** Preview a coupon against a subtotal — returns validity + discount, no 400. */
const check = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase() });
  if (!coupon) {
    return sendSuccess(res, { valid: false, reason: 'Invalid coupon code' });
  }
  const { valid, reason } = couponService.checkCouponValidity(coupon, { subtotal });
  const discount = valid ? computeCouponDiscount(coupon, subtotal) : 0;
  return sendSuccess(res, {
    valid,
    reason,
    discount,
    coupon: valid ? { code: coupon.code, type: coupon.type, value: coupon.value } : undefined,
  });
});

module.exports = { list, create, getById, update, remove, check };
