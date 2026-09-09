/**
 * Review routes — /api/reviews. Public can read a vehicle's visible reviews;
 * an authenticated customer posts a review for their own completed booking;
 * staff moderate (hide/feature).
 */
const express = require('express');
const controller = require('../controllers/review.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/review.validation');
const { idParam, paramId } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { requireStaffUp } = require('../middleware/rbac.middleware');

const router = express.Router();

// Public
router.get(
  '/vehicle/:vehicleId',
  validate({ params: paramId('vehicleId'), ...schema.listForVehicle }),
  controller.listForVehicle
);

// Authenticated customer
router.post('/', authenticate, validate(schema.create), controller.create);

// Staff moderation
router.patch(
  '/:id/visibility',
  authenticate,
  requireStaffUp,
  validate({ params: idParam, ...schema.setVisibility }),
  controller.setVisibility
);
router.patch(
  '/:id/featured',
  authenticate,
  requireStaffUp,
  validate({ params: idParam, ...schema.setFeatured }),
  controller.setFeatured
);

module.exports = router;
