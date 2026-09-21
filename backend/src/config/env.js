/**
 * Loads, normalizes, and validates environment variables into a typed config
 * object. Importing this module is the only place `process.env` is read, so the
 * rest of the app depends on a validated `config` instead of raw env access.
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isTest = NODE_ENV === 'test';
const isProd = NODE_ENV === 'production';

const toInt = (val, fallback) => {
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? fallback : n;
};

const splitList = (val) =>
  (val || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const config = {
  env: NODE_ENV,
  isTest,
  isProd,
  isDev: NODE_ENV === 'development',
  port: toInt(process.env.PORT, 5000),
  clientUrls: splitList(process.env.CLIENT_URL) || [],

  db: {
    uri: process.env.MONGODB_URI,
    testUri: process.env.MONGODB_URI_TEST,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || (isTest ? 'test_access_secret' : undefined),
    refreshSecret: process.env.JWT_REFRESH_SECRET || (isTest ? 'test_refresh_secret' : undefined),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 10),

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'car-rental',
    get enabled() {
      return Boolean(this.cloudName && this.apiKey && this.apiSecret);
    },
  },

  owner: {
    email: process.env.OWNER_EMAIL || 'owner@example.com',
    password: process.env.OWNER_PASSWORD || 'Owner@12345',
    name: process.env.OWNER_NAME || 'Business Owner',
  },

  // External notification delivery. Both channels are optional and provider-
  // agnostic — leave the env vars unset and delivery is simply skipped (in-app
  // notifications still persist). No SDKs required; delivery uses native fetch.
  notifications: {
    // Transactional email via any HTTP JSON API (e.g. Resend, Brevo, Mailgun).
    // We POST { from, to, subject, text } and send the API key as a Bearer token.
    email: {
  apiUrl:
    process.env.EMAIL_API_URL ||
    'https://api.mailjet.com/v3.1/send',

  apiKey: process.env.EMAIL_API_KEY,

  apiSecret: process.env.EMAIL_API_SECRET,

  from: process.env.EMAIL_FROM,

  fromName:
    process.env.EMAIL_FROM_NAME ||
    'Akash Car Rental',

  get enabled() {
    return Boolean(
      this.apiUrl &&
      this.apiKey &&
      this.apiSecret &&
      this.from
    );
  },
},
    // WhatsApp via Meta's WhatsApp Cloud API (Graph API). Needs a phone-number
    // id and a permanent token. Sends plain text messages.
    whatsapp: {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      token: process.env.WHATSAPP_TOKEN,
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
      get enabled() {
        return Boolean(this.phoneNumberId && this.token);
      },
    },
  },

  uploads: {
    maxBytes: toInt(process.env.MAX_UPLOAD_MB, 8) * 1024 * 1024,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  },

  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 15) * 60 * 1000,
    max: toInt(process.env.RATE_LIMIT_MAX, 300),
    authMax: toInt(process.env.AUTH_RATE_LIMIT_MAX, 20),
  },
};

/**
 * Fail fast at startup if critical secrets are missing. Skipped for tests
 * (which inject their own in-memory Mongo + default secrets).
 */
function validateConfig() {
  if (isTest) return;

  const missing = [];
  if (!config.db.uri) missing.push('MONGODB_URI');
  if (!config.jwt.accessSecret) missing.push('JWT_ACCESS_SECRET');
  if (!config.jwt.refreshSecret) missing.push('JWT_REFRESH_SECRET');

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in the values.'
    );
  }

  if (isProd) {
    const weak = ['change_me', 'test_access_secret', 'test_refresh_secret'];
    if (weak.some((w) => config.jwt.accessSecret.includes(w))) {
      throw new Error('JWT_ACCESS_SECRET must be set to a strong value in production.');
    }
    if (!config.cloudinary.enabled) {
      // Not fatal, but warn — uploads will fall back to a stub.
      // eslint-disable-next-line no-console
      console.warn('[config] Cloudinary is not configured; file uploads will be disabled.');
    }
  }
}

module.exports = { config, validateConfig };
