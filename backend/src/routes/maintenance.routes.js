/**
 * Maintenance routes — /api/maintenance. Staff-only.
 */
const express = require('express');
const controller = require('../controllers/maintenance.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/maintenance.validation');
const { idParam } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { requireStaffUp } = require('../middleware/rbac.middleware');

const router = express.Router();
router.use(authenticate, requireStaffUp);

router.get('/', validate(schema.list), controller.list);
router.post('/', validate(schema.schedule), controller.schedule);
router.post('/:id/start', validate({ params: idParam }), controller.start);
router.post('/:id/complete', validate({ params: idParam, ...schema.complete }), controller.complete);
router.post('/:id/cancel', validate({ params: idParam }), controller.cancel);

module.exports = router;
