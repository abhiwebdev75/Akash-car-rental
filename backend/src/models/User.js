/**
 * User model — covers every human actor: OWNER, MANAGER, STAFF, ACCOUNTANT and
 * CUSTOMER. Passwords are stored only as a bcrypt hash and never serialized.
 */
const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  ROLES,
  USER_STATUS,
  enumValues,
} = require('../config/constants');
const { config } = require('../config/env');

const addressSchema = new Schema(
  {
    line1: String,
    city: String,
    state: String,
    pincode: String,
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true },
    // Never selected by default; must be explicitly requested for auth.
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: enumValues(ROLES),
      default: ROLES.CUSTOMER,
      index: true,
    },
    status: {
      type: String,
      enum: enumValues(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    // Set the moment a user confirms their email via OTP. Null = unverified.
    // Staff/seed accounts are created pre-verified so they're never gated.
    emailVerifiedAt: { type: Date, default: null },
    // Location scoping for MANAGER/STAFF.
    assignedLocation: { type: Schema.Types.ObjectId, ref: 'Location', index: true },
    address: addressSchema,
    profilePhoto: { url: String, publicId: String },
    refreshTokenHash: { type: String, select: false },

    // Optional loyalty tracking (architecture ready; not required for booking).
    loyalty: {
      points: { type: Number, default: 0 },
      completedRentals: { type: Number, default: 0 },
      referralCount: { type: Number, default: 0 },
      totalSpend: { type: Number, default: 0 },
    },

    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokenHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Phone unique only when present (sparse) to allow multiple null phones.
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

userSchema.virtual('isStaff').get(function isStaff() {
  return this.role !== ROLES.CUSTOMER;
});

userSchema.virtual('isEmailVerified').get(function isEmailVerified() {
  return !!this.emailVerifiedAt;
});

/** Hash and set the password. Call before save when (re)setting a password. */
userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, config.bcryptSaltRounds);
};

/** Compare a plaintext password against the stored hash. */
userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash || '');
};

/** Store a hashed refresh token so it can be rotated/revoked. */
userSchema.methods.setRefreshToken = async function setRefreshToken(token) {
  this.refreshTokenHash = token ? await bcrypt.hash(token, config.bcryptSaltRounds) : null;
};

userSchema.methods.compareRefreshToken = function compareRefreshToken(token) {
  if (!this.refreshTokenHash) return Promise.resolve(false);
  return bcrypt.compare(token, this.refreshTokenHash);
};

module.exports = model('User', userSchema);
