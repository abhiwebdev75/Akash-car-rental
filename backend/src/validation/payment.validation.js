/**
 * Payment validation.
 */
const { Joi, objectId } = require('./common');
const { PAYMENT_KIND, PAYMENT_METHOD, enumValues } = require('../config/constants');

const record = {
  body: Joi.object({
    bookingId: objectId.required(),
    amount: Joi.number().greater(0).required(),
    kind: Joi.string().valid(...enumValues(PAYMENT_KIND)).default(PAYMENT_KIND.RENTAL),
    method: Joi.string().valid(...enumValues(PAYMENT_METHOD)).default(PAYMENT_METHOD.CASH),
    transactionRef: Joi.string().max(120).allow(''),
    notes: Joi.string().max(500).allow(''),
  }),
};

const refund = {
  body: Joi.object({
    bookingId: objectId.required(),
    amount: Joi.number().greater(0).required(),
    kind: Joi.string().valid(PAYMENT_KIND.REFUND, PAYMENT_KIND.DEPOSIT_REFUND).default(PAYMENT_KIND.REFUND),
    method: Joi.string().valid(...enumValues(PAYMENT_METHOD)).default(PAYMENT_METHOD.CASH),
    notes: Joi.string().max(500).allow(''),
  }),
};

module.exports = { record, refund };
