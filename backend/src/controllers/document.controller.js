/**
 * Document controller. Customers register and download their own sensitive
 * documents (licence/ID); staff can list a booking's documents and verify them.
 * The raw private file URL is never returned — downloads go through a gated
 * endpoint that authorizes the caller and returns a short-lived signed URL.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/ApiResponse');
const documentService = require('../services/document.service');

const create = asyncHandler(async (req, res) => {
  const doc = await documentService.createDocument({ ...req.body, ownerId: req.user._id });
  return sendCreated(res, doc, { message: 'Document submitted' });
});

const listMine = asyncHandler(async (req, res) => {
  const docs = await documentService.listForOwner(req.user._id);
  return sendSuccess(res, docs);
});

const listForBooking = asyncHandler(async (req, res) => {
  const docs = await documentService.listForBooking(req.params.bookingId);
  return sendSuccess(res, docs);
});

/** Authorized, short-lived signed download URL. */
const download = asyncHandler(async (req, res) => {
  const result = await documentService.getDownloadUrl(req.params.id, req.user);
  return sendSuccess(res, result);
});

/** Staff verify/reject a document. */
const setStatus = asyncHandler(async (req, res) => {
  const doc = await documentService.setStatus(req.params.id, req.body.status, req.user._id);
  return sendSuccess(res, doc, { message: 'Document status updated' });
});

module.exports = { create, listMine, listForBooking, download, setStatus };
