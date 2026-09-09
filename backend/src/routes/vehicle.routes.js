/**
 * Vehicle routes — /api/vehicles.
 * Public: browse catalog, availability search, vehicle detail.
 * Admin (manager/owner): full CRUD and image management.
 * Static paths are declared before "/:id" so they aren't shadowed.
 */
const express = require('express');
const controller = require('../controllers/vehicle.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/vehicle.validation');
const { idParam, Joi } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { requireManagerUp } = require('../middleware/rbac.middleware');
const { imageUpload } = require('../middleware/upload.middleware');

const router = express.Router();

// Public
router.get('/', validate(schema.browse), controller.browse);
router.get('/availability', validate(schema.availability), controller.search);

// Admin listing (must precede "/:id")
router.get('/admin', authenticate, requireManagerUp, controller.adminList);

router.get('/:id', validate({ params: idParam }), controller.getPublic);

// Admin mutations
router.post('/', authenticate, requireManagerUp, validate(schema.create), controller.create);
router.patch('/:id', authenticate, requireManagerUp, validate({ params: idParam, ...schema.update }), controller.update);
router.delete('/:id', authenticate, requireManagerUp, validate({ params: idParam }), controller.remove);

// Images
router.post(
  '/:id/images',
  authenticate,
  requireManagerUp,
  validate({ params: idParam }),
  imageUpload.array('images', 10),
  controller.uploadImages
);
router.delete(
  '/:id/images',
  authenticate,
  requireManagerUp,
  validate({
    params: idParam,
    body: Joi.object({ publicId: Joi.string().required() }),
  }),
  controller.deleteImage
);

module.exports = router;
