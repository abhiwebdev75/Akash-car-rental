/**
 * Vehicle transfer routes — /api/transfers. Manager/owner only (moving fleet
 * across locations is a management action).
 */
const express = require('express');
const controller = require('../controllers/transfer.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/transfer.validation');
const { idParam } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { requireManagerUp } = require('../middleware/rbac.middleware');

const router = express.Router();
router.use(authenticate, requireManagerUp);

router.get('/', validate(schema.list), controller.list);
router.post('/', validate(schema.create), controller.create);
router.post('/:id/complete', validate({ params: idParam }), controller.complete);
router.post('/:id/cancel', validate({ params: idParam }), controller.cancel);

module.exports = router;
