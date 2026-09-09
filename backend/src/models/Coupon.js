/**
 * Coupon model. Percentage or fixed discounts with optional minimum-rental
 * threshold, maximum-discount cap, validity window, and usage limit. All
 * validation/application happens server-side in the coupon + pricing services.
 */
const { Schema, model } = require('mongoose');
const { COUPON_TYPE, enumValues } = require('../config/constants');

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: enumValues(COUPON_TYPE), required: true },
    value: { type: Number, required: true, min: 0 }, // percent (0-100) or amount
    minimumRental: { type: Number, default: 0, min: 0 }, // min rental subtotal to qualify
    maximumDiscount: { type: Number, min: 0 }, // cap for PERCENTAGE coupons
    startDate: Date,
    endDate: Date,
    usageLimit: { type: Number, min: 0 }, // total redemptions (undefined = unlimited)
    usedCount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = model('Coupon', couponSchema);
