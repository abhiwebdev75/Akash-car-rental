/**
 * Document model — sensitive customer files (driving licence, government ID).
 * The stored `fileUrl` points at a private/authenticated Cloudinary asset; it is
 * NEVER exposed directly. Downloads go through a gated controller that verifies
 * ownership/authorization and issues a short-lived signed URL.
 */
const { Schema, model } = require('mongoose');
const { DOCUMENT_TYPE, DOCUMENT_STATUS, enumValues } = require('../config/constants');

const documentSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    type: { type: String, enum: enumValues(DOCUMENT_TYPE), required: true },
    fileUrl: { type: String, required: true }, // private asset URL
    publicId: String,
    fileName: String,
    mimeType: String,
    sizeBytes: Number,
    status: {
      type: String,
      enum: enumValues(DOCUMENT_STATUS),
      default: DOCUMENT_STATUS.PENDING,
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        // Never leak the raw private URL in list responses.
        delete ret.fileUrl;
        return ret;
      },
    },
  }
);

module.exports = model('Document', documentSchema);
