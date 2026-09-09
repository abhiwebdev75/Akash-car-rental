/**
 * Cloudinary SDK configuration. The rest of the app uploads through
 * `services/upload.service.js`, which uses this configured client. When
 * Cloudinary env vars are absent (e.g. local dev without an account), the
 * service degrades gracefully instead of crashing.
 */
const { v2: cloudinary } = require('cloudinary');
const { config } = require('./env');

if (config.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

module.exports = { cloudinary, cloudinaryEnabled: config.cloudinary.enabled };
