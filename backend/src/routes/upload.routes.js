/**
 * Upload routes — /api/uploads. Any authenticated user may upload (customers
 * upload their licence/ID; staff upload inspection/damage photos). Files are
 * validated and size-limited by the multer middleware.
 */
const express = require('express');
const controller = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { imageUpload, documentUpload } = require('../middleware/upload.middleware');

const router = express.Router();
router.use(authenticate);

router.post('/image', imageUpload.single('file'), controller.image);
router.post('/document', documentUpload.single('file'), controller.document);

module.exports = router;
