/**
 * Report routes — /api/reports. Finance roles only (owner/manager/accountant).
 * Location-scoped managers are automatically restricted to their location by the
 * controller. Every endpoint supports ?format=csv.
 */
const express = require('express');
const controller = require('../controllers/report.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/report.validation');
const { authenticate } = require('../middleware/auth.middleware');
const { requireFinance } = require('../middleware/rbac.middleware');

const router = express.Router();
router.use(authenticate, requireFinance);

router.get('/revenue', validate(schema.range), controller.revenue);
router.get('/bookings', validate(schema.range), controller.bookings);
router.get('/utilization', validate(schema.range), controller.utilization);
router.get('/outstanding', validate(schema.range), controller.outstanding);

module.exports = router;
