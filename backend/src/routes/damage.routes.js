/**
 * Damage routes — /api/damages. Staff-only. Static routes precede /:id.
 */
const express = require('express');
const controller = require('../controllers/damage.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/damage.validation');
const { idParam } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { requireStaffUp } = require('../middleware/rbac.middleware');

const router = express.Router();
router.use(authenticate, requireStaffUp);

router.get('/', validate(schema.list), controller.list);
router.post('/', validate(schema.report), controller.report);
router.get('/:id', validate({ params: idParam }), controller.getById);
router.patch('/:id', validate({ params: idParam, ...schema.update }), controller.update);

module.exports = router;
