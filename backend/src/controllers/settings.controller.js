/**
 * Settings controller. Public GET exposes only customer-safe business info
 * (name, contact, currency, policies). Full settings and updates are owner-only,
 * so business configuration is never hardcoded in the app.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const Settings = require('../models/Settings');

/** Public: customer-safe subset for the storefront. */
const getPublic = asyncHandler(async (req, res) => {
  const s = await Settings.getSettings();
  return sendSuccess(res, {
    businessName: s.businessName,
    logo: s.logo,
    phone: s.phone,
    email: s.email,
    whatsapp: s.whatsapp,
    address: s.address,
    currency: s.currency,
    taxRate: s.taxRate,
    policies: s.policies,
  });
});

/** Admin: full settings document. */
const get = asyncHandler(async (req, res) => {
  const s = await Settings.getSettings();
  return sendSuccess(res, s);
});

/** Admin: merge updates into the singleton settings document. */
const update = asyncHandler(async (req, res) => {
  const s = await Settings.getSettings();
  const body = req.body;
  // Shallow-merge nested groups so partial updates don't wipe siblings.
  ['policies', 'booking', 'charges', 'logo'].forEach((group) => {
    if (body[group]) {
      s[group] = { ...(s[group] ? s[group].toObject?.() ?? s[group] : {}), ...body[group] };
      delete body[group];
    }
  });
  Object.assign(s, body);
  await s.save();
  return sendSuccess(res, s, { message: 'Settings updated' });
});

module.exports = { getPublic, get, update };
