/**
 * EmailOtp — a short-lived one-time password tied to a user and a purpose
 * (email verification or password reset). The code is never stored in plain
 * text; only a bcrypt hash is kept, so a database leak can't reveal live codes.
 *
 * A TTL index expires documents at `expiresAt`, and we also track attempts so a
 * code can be locked after too many wrong guesses. At most one active (unused,
 * unexpired) OTP exists per {userId, purpose} — the service invalidates prior
 * ones before issuing a new code.
 */
const { Schema, model } = require('mongoose');
const { OTP_PURPOSE, enumValues } = require('../config/constants');

const emailOtpSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purpose: { type: String, enum: enumValues(OTP_PURPOSE), required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Fast lookup of the active code for a given purpose.
emailOtpSchema.index({ userId: 1, purpose: 1, consumedAt: 1 });

// TTL: Mongo removes the document once `expiresAt` passes (background sweep).
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = model('EmailOtp', emailOtpSchema);
