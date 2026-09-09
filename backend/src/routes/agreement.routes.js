/**
 * Agreement routes — /api/agreements. Generation is staff-only; the owning
 * customer may fetch and sign.
 */
const express = require('express');
const controller = require('../controllers/agreement.controller');
const validate = require('../middleware/validate.middleware');
const { paramId } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { requireStaffUp } = require('../middleware/rbac.middleware');

const router = express.Router();
router.use(authenticate);

const bookingParam = { params: paramId('bookingId') };

router.post('/booking/:bookingId/generate', requireStaffUp, validate(bookingParam), controller.generate);
router.get('/booking/:bookingId', validate(bookingParam), controller.getByBooking);
router.post('/booking/:bookingId/sign', validate(bookingParam), controller.sign);

module.exports = router;
