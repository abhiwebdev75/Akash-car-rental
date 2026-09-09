/**
 * Document routes — /api/documents. Customers register and download their own
 * documents; staff list a booking's documents and verify them. Downloads are
 * gated and return a short-lived signed URL (the raw URL is never exposed).
 * Static routes precede /:id.
 */
const express = require('express');
const controller = require('../controllers/document.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/document.validation');
const { idParam, paramId } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { requireStaffUp } = require('../middleware/rbac.middleware');

const router = express.Router();
router.use(authenticate);

router.post('/', validate(schema.create), controller.create);
router.get('/me', controller.listMine);
router.get(
  '/booking/:bookingId',
  requireStaffUp,
  validate({ params: paramId('bookingId') }),
  controller.listForBooking
);
router.get('/:id/download', validate({ params: idParam }), controller.download);
router.patch(
  '/:id/status',
  requireStaffUp,
  validate({ params: idParam, ...schema.setStatus }),
  controller.setStatus
);

module.exports = router;
