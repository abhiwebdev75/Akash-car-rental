/**
 * AddOn model — optional extras a customer can add to a booking (child seat,
 * GPS, additional driver, etc.). Pricing is per-rental, per-day, or per-unit.
 */
const { Schema, model } = require('mongoose');
const { ADDON_PRICING_TYPE, enumValues } = require('../config/constants');

const addOnSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    pricingType: {
      type: String,
      enum: enumValues(ADDON_PRICING_TYPE),
      default: ADDON_PRICING_TYPE.PER_RENTAL,
    },
    maxQuantity: { type: Number, default: 1, min: 1 }, // relevant for PER_UNIT
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = model('AddOn', addOnSchema);
