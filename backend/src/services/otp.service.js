/**
 * OTP service — issues and verifies short-lived numeric codes for email
 * verification and password reset. Codes are 6 digits, stored only as a bcrypt
 * hash, expire after a few minutes, and lock after too many wrong attempts.
 * A per-user/purpose cooldown blunts resend spam.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const EmailOtp = require('../models/EmailOtp');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { config } = require('../config/env');
const { sendEmail } = require('./email.service');

const CODE_LENGTH = 6;
const TTL_MS = 10 * 60 * 1000; // codes valid for 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // min gap between sends
const MAX_ATTEMPTS = 5; // wrong guesses before a code is burned

/** Cryptographically-random zero-padded 6-digit code. */
function generateCode() {
  const max = 10 ** CODE_LENGTH;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(CODE_LENGTH, '0');
}

function emailCopy(purpose, code) {
  if (purpose === 'PASSWORD_RESET') {
    return {
      subject: 'Your password reset code',
      text:
        `Use this code to reset your password: ${code}\n\n` +
        `It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    };
  }
  return {
    subject: 'Verify your email',
    text:
      `Welcome! Your email verification code is: ${code}\n\n` +
      `It expires in 10 minutes. Enter it to activate your account.`,
  };
}

/**
 * Create a fresh OTP for {userId, purpose}, invalidating any prior active code,
 * and email it. Enforces a resend cooldown. Returns nothing sensitive.
 */
async function generateAndSend({ user, purpose }) {
  // Cooldown: reject if the most recent code was sent very recently.
  const recent = await EmailOtp.findOne({ userId: user._id, purpose, consumedAt: null }).sort({
    createdAt: -1,
  });
  if (recent && Date.now() - new Date(recent.lastSentAt).getTime() < RESEND_COOLDOWN_MS) {
    throw ApiError.tooMany('Please wait a moment before requesting another code.');
  }

  // Invalidate any outstanding codes for this purpose so only one is live.
  await EmailOtp.updateMany(
    { userId: user._id, purpose, consumedAt: null },
    { consumedAt: new Date() }
  );

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, config.bcryptSaltRounds);
  await EmailOtp.create({
    userId: user._id,
    purpose,
    codeHash,
    expiresAt: new Date(Date.now() + TTL_MS),
    lastSentAt: new Date(),
  });

  const { subject, text } = emailCopy(purpose, code);
  // Best-effort: a delivery failure shouldn't 500 the request. In dev without a
  // provider, email.service logs the code so the flow is still testable.
  try {
    await sendEmail({ to: user.email, subject, text });
  } catch (err) {
    logger.warn({ err, userId: String(user._id), purpose }, 'OTP email delivery failed');
  }

  return { expiresInMs: TTL_MS };
}

/**
 * Verify a submitted code for {userId, purpose}. On success the code is
 * consumed (single-use). Throws a 400 on wrong/expired/locked codes.
 */
async function verify({ userId, purpose, code }) {
  const otp = await EmailOtp.findOne({ userId, purpose, consumedAt: null }).sort({ createdAt: -1 });
  if (!otp) throw ApiError.badRequest('No active code. Please request a new one.');

  if (otp.expiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest('This code has expired. Please request a new one.');
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    throw ApiError.badRequest('Too many incorrect attempts. Please request a new code.');
  }

  const ok = await bcrypt.compare(String(code), otp.codeHash);
  if (!ok) {
    otp.attempts += 1;
    await otp.save();
    throw ApiError.badRequest('Incorrect code. Please try again.');
  }

  otp.consumedAt = new Date();
  await otp.save();
  return true;
}

module.exports = { generateAndSend, verify, TTL_MS, RESEND_COOLDOWN_MS };
