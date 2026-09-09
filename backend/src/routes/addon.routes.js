/**
 * AddOn routes — /api/addons. Listing is available to any authenticated user
 * (customers attach add-ons at booking time); mutations are manager/owner only.
 */
const express = require('express');
const controller = require('../controllers/addon.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/addon.validation');
const { idParam } = require('../validation/common');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { requireManagerUp } = require('../middleware/rbac.middleware');

const router = express.Router();

router.get('/', optionalAuth, controller.list);
router.post('/', authenticate, requireManagerUp, validate(schema.create), controller.create);
router.patch('/:id', authenticate, requireManagerUp, validate({ params: idParam, ...schema.update }), controller.update);
router.delete('/:id', authenticate, requireManagerUp, validate({ params: idParam }), controller.remove);

module.exports = router;
