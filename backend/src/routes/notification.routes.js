/**
 * Notification routes — /api/notifications. Every route is scoped to the
 * authenticated user's own inbox. Static routes precede /:id.
 */
const express = require('express');
const controller = require('../controllers/notification.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/notification.validation');
const { idParam } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', validate(schema.list), controller.list);
router.get('/unread-count', controller.unreadCount);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', validate({ params: idParam }), controller.markRead);

module.exports = router;
