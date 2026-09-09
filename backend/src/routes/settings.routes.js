/**
 * Settings routes — /api/settings. Public storefront subset; full read for
 * managers; updates for the owner only.
 */
const express = require('express');
const controller = require('../controllers/settings.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/settings.validation');
const { authenticate } = require('../middleware/auth.middleware');
const { requireManagerUp, requireOwner } = require('../middleware/rbac.middleware');

const router = express.Router();

router.get('/public', controller.getPublic);
router.get('/', authenticate, requireManagerUp, controller.get);
router.patch('/', authenticate, requireOwner, validate(schema.update), controller.update);

module.exports = router;
