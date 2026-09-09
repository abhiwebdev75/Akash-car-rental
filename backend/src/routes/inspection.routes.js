/**
 * Inspection routes — /api/inspections. Staff-only.
 */
const express = require('express');
const controller = require('../controllers/inspection.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/inspection.validation');
const { paramId } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { requireStaffUp } = require('../middleware/rbac.middleware');

const router = express.Router();
router.use(authenticate, requireStaffUp);

router.post('/', validate(schema.create), controller.create);
router.get('/booking/:bookingId', validate({ params: paramId('bookingId') }), controller.getByBooking);

module.exports = router;
