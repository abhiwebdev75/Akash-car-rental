/**
 * Upload service — a thin abstraction over Cloudinary.
 *
 * If Cloudinary credentials are configured, files are uploaded there and a
 * `{ url, publicId }` is returned. If not (e.g. local dev without keys), the
 * service degrades gracefully: it returns a deterministic stub reference and
 * logs a warning instead of throwing, so the rest of the flow keeps working.
 * Callers never need to know which mode is active.
 */
const { config } = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

let cloudinary = null;
if (config.cloudinary.enabled) {
  // Lazy-require so environments without the dependency/keys don't fail to boot.
  // eslint-disable-next-line global-require
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

function isConfigured() {
  return Boolean(cloudinary);
}

/**
 * Upload a file buffer.
 * @param {Buffer} buffer
 * @param {object} [opts]
 * @param {string} [opts.folder]        sub-folder under the configured root
 * @param {'image'|'raw'|'auto'} [opts.resourceType]
 * @param {string} [opts.filename]      original name (used for the stub ref)
 * @returns {Promise<{url:string, publicId:string, stub?:boolean}>}
 */
async function uploadBuffer(buffer, { folder = '', resourceType = 'image', filename = 'file' } = {}) {
  if (!buffer || !buffer.length) throw ApiError.badRequest('No file data to upload');

  const fullFolder = [config.cloudinary.folder, folder].filter(Boolean).join('/');

  if (!isConfigured()) {
    // Graceful degradation — no external storage available.
    logger.warn('[upload] Cloudinary not configured; returning stub reference');
    const stubId = `${fullFolder}/stub-${Date.now()}-${filename}`.replace(/\s+/g, '_');
    return { url: `about:blank#${encodeURIComponent(stubId)}`, publicId: stubId, stub: true };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: fullFolder, resource_type: resourceType },
      (err, result) => {
        if (err) return reject(err);
        return resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/** Convenience: upload a Multer file object (`{ buffer, originalname }`). */
async function uploadFile(file, opts = {}) {
  if (!file) throw ApiError.badRequest('No file provided');
  return uploadBuffer(file.buffer, { ...opts, filename: file.originalname });
}

/** Upload many Multer files, preserving order. */
async function uploadMany(files = [], opts = {}) {
  return Promise.all(files.map((f) => uploadFile(f, opts)));
}

/**
 * Produce a short-lived signed URL for a private asset. Used to gate downloads
 * of sensitive documents (licences, IDs): the controller authorizes the request
 * and then hands back a URL that expires quickly. When Cloudinary isn't
 * configured, we fall back to the stored URL so local dev still works.
 * @param {string} publicId
 * @param {object} [opts]
 * @param {string} [opts.fallbackUrl]  URL to return when unconfigured
 * @param {'image'|'raw'|'auto'} [opts.resourceType]
 * @param {number} [opts.expiresInSeconds]
 * @returns {{ url:string, expiresAt:string, signed:boolean }}
 */
function signedUrl(publicId, { fallbackUrl, resourceType = 'auto', expiresInSeconds = 300 } = {}) {
  const expiresAtSec = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const expiresAt = new Date(expiresAtSec * 1000).toISOString();
  if (!isConfigured() || !publicId) {
    return { url: fallbackUrl || null, expiresAt, signed: false };
  }
  const url = cloudinary.url(publicId, {
    type: 'authenticated',
    resource_type: resourceType,
    sign_url: true,
    expires_at: expiresAtSec,
    secure: true,
  });
  return { url, expiresAt, signed: true };
}

/** Delete an asset by publicId (no-op for stubs / when unconfigured). */
async function destroy(publicId) {
  if (!publicId || !isConfigured() || publicId.startsWith(`${config.cloudinary.folder}/stub-`)) {
    return { result: 'skipped' };
  }
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    logger.warn({ err, publicId }, '[upload] failed to delete asset');
    return { result: 'error' };
  }
}

module.exports = { isConfigured, uploadBuffer, uploadFile, uploadMany, signedUrl, destroy };
