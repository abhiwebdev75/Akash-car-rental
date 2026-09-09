/**
 * Upload controller — generic file upload endpoints. The frontend uploads an
 * image/document here, receives a { url, publicId } reference, and then submits
 * that reference as part of an inspection, damage report, emergency, etc. This
 * keeps binary handling out of the domain endpoints.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendCreated } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const uploadService = require('../services/upload.service');

const image = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded (field name: "file")');
  const folder = (req.body && req.body.folder) || 'misc';
  const result = await uploadService.uploadFile(req.file, { folder, resourceType: 'image' });
  return sendCreated(res, result);
});

const document = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded (field name: "file")');
  const result = await uploadService.uploadFile(req.file, { folder: 'documents', resourceType: 'auto' });
  return sendCreated(res, result);
});

module.exports = { image, document };
