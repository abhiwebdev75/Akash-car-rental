/**
 * User routes — /api/users. Self-service profile (/me) for anyone signed in;
 * user management for admins (list/detail for manager+, create/update for owner).
 * Static /me precedes /:id.
 */
const express = require('express');
const controller = require('../controllers/user.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/user.validation');
const { idParam } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { requireManagerUp, requireOwner } = require('../middleware/rbac.middleware');

const router = express.Router();
router.use(authenticate);

// Self-service
router.get('/me', controller.me);
router.patch('/me', validate(schema.updateProfile), controller.updateProfile);

// Admin management
router.get('/', requireManagerUp, validate(schema.list), controller.list);
router.post('/', requireOwner, validate(schema.createStaff), controller.createStaff);
router.get('/:id', requireManagerUp, validate({ params: idParam }), controller.getById);
router.patch('/:id', requireOwner, validate({ params: idParam, ...schema.updateUser }), controller.update);

module.exports = router;
