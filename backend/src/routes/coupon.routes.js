/**
 * Coupon routes — /api/coupons. Admin CRUD (manager+); any authenticated user
 * can preview a code via /check. Static routes precede /:id.
 */
const express = require('express');
const controller = require('../controllers/coupon.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/coupon.validation');
const { idParam } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { requireManagerUp } = require('../middleware/rbac.middleware');

const router = express.Router();
router.use(authenticate);

// Preview a coupon (any authenticated user).
router.post('/check', validate(schema.check), controller.check);

// Admin management.
router.get('/', requireManagerUp, controller.list);
router.post('/', requireManagerUp, validate(schema.create), controller.create);
router.get('/:id', requireManagerUp, validate({ params: idParam }), controller.getById);
router.patch('/:id', requireManagerUp, validate({ params: idParam, ...schema.update }), controller.update);
router.delete('/:id', requireManagerUp, validate({ params: idParam }), controller.remove);

module.exports = router;
