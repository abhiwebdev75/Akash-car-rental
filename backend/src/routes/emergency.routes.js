/**
 * Emergency routes — /api/emergencies. A customer raises/lists their own
 * requests; staff list all, view detail, and update status.
 */
const express = require('express');
const controller = require('../controllers/emergency.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/emergency.validation');
const { idParam } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { requireStaffUp } = require('../middleware/rbac.middleware');

const router = express.Router();
router.use(authenticate);

router.post('/', validate(schema.create), controller.create);
router.get('/', validate(schema.list), controller.list);
router.get('/:id', requireStaffUp, validate({ params: idParam }), controller.getById);
router.patch(
  '/:id/status',
  requireStaffUp,
  validate({ params: idParam, ...schema.updateStatus }),
  controller.updateStatus
);

module.exports = router;
