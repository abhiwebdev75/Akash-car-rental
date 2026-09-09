/**
 * Document validation. The file is uploaded first via /api/uploads/document;
 * the resulting { url, publicId } is submitted here to register the document.
 * The raw URL is never returned in listings (see the model's toJSON).
 */
const { Joi, objectId } = require('./common');
const { DOCUMENT_TYPE, DOCUMENT_STATUS, enumValues } = require('../config/constants');

const create = {
  body: Joi.object({
    type: Joi.string().valid(...enumValues(DOCUMENT_TYPE)).required(),
    fileUrl: Joi.string().uri({ allowRelative: true }).required(),
    publicId: Joi.string().allow(''),
    fileName: Joi.string().max(255).allow(''),
    mimeType: Joi.string().max(100).allow(''),
    sizeBytes: Joi.number().integer().min(0),
    bookingId: objectId,
  }),
};

const setStatus = {
  body: Joi.object({
    status: Joi.string().valid(...enumValues(DOCUMENT_STATUS)).required(),
  }),
};

module.exports = { create, setStatus };
