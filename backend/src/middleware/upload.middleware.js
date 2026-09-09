/**
 * Multer upload middleware factories. Files are held in memory and then streamed
 * to Cloudinary by the upload service (so we control folder, transforms, and
 * access mode). Type and size are validated here before anything is uploaded.
 */
const multer = require('multer');
const { config } = require('../config/env');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage();

function makeUpload(allowedMimeTypes) {
  return multer({
    storage,
    limits: { fileSize: config.uploads.maxBytes },
    fileFilter(_req, file, cb) {
      if (allowedMimeTypes.includes(file.mimetype)) return cb(null, true);
      return cb(
        ApiError.badRequest(
          `Unsupported file type "${file.mimetype}". Allowed: ${allowedMimeTypes.join(', ')}`
        )
      );
    },
  });
}

// Images: vehicle photos, inspection photos, damage photos, profile photos.
const imageUpload = makeUpload(config.uploads.allowedImageTypes);
// Documents: driving licence, government id (images or PDF).
const documentUpload = makeUpload(config.uploads.allowedDocTypes);

module.exports = { imageUpload, documentUpload, makeUpload };
