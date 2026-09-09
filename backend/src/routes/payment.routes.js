/**
 * Payment routes — /api/payments. Recording is open to any staff role; refunds
 * are finance-only (owner/manager/accountant).
 */
const express = require('express');
const controller = require('../controllers/payment.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/payment.validation');
const { paramId } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize, requireFinance } = require('../middleware/rbac.middleware');
const { STAFF_ROLES } = require('../config/constants');

const router = express.Router();
router.use(authenticate);

router.post('/', authorize(...STAFF_ROLES), validate(schema.record), controller.record);
router.post('/refund', requireFinance, validate(schema.refund), controller.refund);
router.get('/booking/:bookingId', authorize(...STAFF_ROLES), validate({ params: paramId('bookingId') }), controller.listByBooking);
router.get('/booking/:bookingId/balance', authorize(...STAFF_ROLES), validate({ params: paramId('bookingId') }), controller.balance);

module.exports = router;
