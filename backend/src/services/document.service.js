/**
 * Document service — manages sensitive customer files (driving licence,
 * government ID). The raw private file URL is NEVER returned in listings (the
 * model strips it in toJSON). Downloads go through `getDownloadUrl`, which
 * authorizes the caller and returns a short-lived signed URL.
 */
const Document = require('../models/Document');
const ApiError = require('../utils/ApiError');
const uploadService = require('./upload.service');
const { ROLES, DOCUMENT_STATUS } = require('../config/constants');

/** Register an already-uploaded file (from /api/uploads/document) as a Document. */
async function createDocument(input) {
  const { ownerId, bookingId, type, fileUrl, publicId, fileName, mimeType, sizeBytes } = input;
  if (!fileUrl) throw ApiError.badRequest('fileUrl is required (upload the file first)');
  return Document.create({
    ownerId,
    bookingId,
    type,
    fileUrl,
    publicId,
    fileName,
    mimeType,
    sizeBytes,
    status: DOCUMENT_STATUS.PENDING,
  });
}

function canAccess(user, doc) {
  if (user.role !== ROLES.CUSTOMER) return true; // staff/admin can access
  return String(doc.ownerId) === String(user._id);
}

async function getForUser(id, user) {
  const doc = await Document.findById(id).select('+fileUrl');
  if (!doc) throw ApiError.notFound('Document not found');
  if (!canAccess(user, doc)) throw ApiError.forbidden('You cannot access this document');
  return doc;
}

/**
 * Authorize and return a short-lived signed download URL. Only the owning
 * customer or staff/admin may download.
 */
async function getDownloadUrl(id, user) {
  const doc = await getForUser(id, user);
  const { url, expiresAt, signed } = uploadService.signedUrl(doc.publicId, {
    fallbackUrl: doc.fileUrl,
    resourceType: 'auto',
    expiresInSeconds: 300,
  });
  return { url, expiresAt, signed, fileName: doc.fileName, mimeType: doc.mimeType };
}

/** Staff verify/reject a submitted document. */
async function setStatus(id, status, verifiedBy) {
  const doc = await Document.findByIdAndUpdate(
    id,
    { status, verifiedBy },
    { new: true }
  );
  if (!doc) throw ApiError.notFound('Document not found');
  return doc;
}

async function listForOwner(ownerId) {
  return Document.find({ ownerId }).sort({ uploadedAt: -1 }).lean();
}

async function listForBooking(bookingId) {
  return Document.find({ bookingId }).sort({ uploadedAt: -1 }).lean();
}

module.exports = {
  createDocument,
  getForUser,
  getDownloadUrl,
  setStatus,
  listForOwner,
  listForBooking,
};
