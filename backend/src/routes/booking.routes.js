/**
 * Booking routes — /api/bookings. All require authentication. Fine-grained
 * ownership/scope checks live in the controller; lifecycle transitions are
 * restricted to staff. Static paths precede "/:id".
 */
const express = require('express');
const controller = require('../controllers/booking.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/booking.validation');
const { idParam } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { requireStaffUp } = require('../middleware/rbac.middleware');

const router = express.Router();
router.use(authenticate);

router.post('/quote', validate(schema.quote), controller.quote);
router.post('/', validate(schema.create), controller.create);
router.get('/', validate(schema.list), controller.list);
router.get('/calendar', requireStaffUp, validate(schema.calendar), controller.calendar);

router.get('/:id', validate({ params: idParam }), controller.getById);
router.post('/:id/confirm', requireStaffUp, validate({ params: idParam }), controller.confirm);
router.post('/:id/activate', requireStaffUp, validate({ params: idParam }), controller.activate);
router.post('/:id/complete', requireStaffUp, validate({ params: idParam }), controller.complete);
router.post('/:id/cancel', validate({ params: idParam, ...schema.cancel }), controller.cancel);

module.exports = router;
