/**
 * Notification service — internal notification layer with a channel
 * abstraction. Today it persists IN_APP notifications; EMAIL / WHATSAPP / SMS
 * delivery can be added by implementing `dispatchExternal` without changing any
 * caller. All domain helpers are best-effort and must never break the primary
 * operation that triggered them (callers use `.catch` where appropriate).
 */
const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const { config } = require('../config/env');
const { sendEmail } = require('./email.service');
const {
  ROLES,
  NOTIFICATION_AUDIENCE,
  NOTIFICATION_TYPE,
  NOTIFICATION_CHANNEL,
} = require('../config/constants');

// ── External delivery (email + WhatsApp) ─────────────────────────────────────
// Provider-agnostic HTTP calls via native fetch (Node 18+) — no SDKs. Each
// sender is a no-op unless its env vars are configured, so the app runs fine
// out of the box and lights up delivery once credentials are present.

/**
 * Normalize an Indian mobile number to WhatsApp's expected format: digits only,
 * with country code, no '+'. Bare 10-digit numbers get a 91 prefix.
 */
function toWhatsAppNumber(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.startsWith('0')) digits = `91${digits.slice(1)}`;
  return digits.length >= 11 ? digits : null;
}

/** Send a WhatsApp text message via Meta's WhatsApp Cloud API. */
async function sendWhatsApp({ to, text }) {
  const { whatsapp } = config.notifications;
  const number = toWhatsAppNumber(to);
  if (!whatsapp.enabled || !number) return;
  const url = `https://graph.facebook.com/${whatsapp.apiVersion}/${whatsapp.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${whatsapp.token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: number,
      type: 'text',
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`WhatsApp API responded ${res.status}: ${detail.slice(0, 200)}`);
  }
}

/**
 * Fan a persisted notification out to its non-in-app channels. Best-effort:
 * resolves the recipient's contact details from the User, then dispatches each
 * requested channel independently so one failure can't block the others. Never
 * throws — callers rely on this being safe to fire-and-forget.
 */
async function dispatchExternal(notification) {
  try {
    const channels = notification.channels || [];
    const wantsEmail = channels.includes(NOTIFICATION_CHANNEL.EMAIL);
    const wantsWhatsApp = channels.includes(NOTIFICATION_CHANNEL.WHATSAPP);
    if (!wantsEmail && !wantsWhatsApp) return;

    const user = await User.findById(notification.userId).select('email phone name').lean();
    if (!user) return;

    const subject = notification.title;
    const text = notification.body ? `${notification.title}\n\n${notification.body}` : notification.title;

    const jobs = [];
    if (wantsEmail) {
      jobs.push(
        sendEmail({ to: user.email, subject, text }).catch((err) =>
          logger.warn({ err, userId: String(user._id) }, 'email delivery failed')
        )
      );
    }
    if (wantsWhatsApp) {
      jobs.push(
        sendWhatsApp({ to: user.phone, text }).catch((err) =>
          logger.warn({ err, userId: String(user._id) }, 'whatsapp delivery failed')
        )
      );
    }
    await Promise.all(jobs);
  } catch (err) {
    logger.warn({ err }, 'dispatchExternal failed');
  }
}

/**
 * Which external channels are actually usable right now, given configuration.
 * Domain helpers use this so we only tag a notification with EMAIL/WHATSAPP when
 * delivery is set up — avoids marking channels that would silently no-op.
 */
function activeExternalChannels() {
  const out = [];
  if (config.notifications.email.enabled) out.push(NOTIFICATION_CHANNEL.EMAIL);
  if (config.notifications.whatsapp.enabled) out.push(NOTIFICATION_CHANNEL.WHATSAPP);
  return out;
}

/** Build the channel list for a customer-facing alert (in-app + any external). */
function customerChannels() {
  return [NOTIFICATION_CHANNEL.IN_APP, ...activeExternalChannels()];
}

/** Create a single in-app notification (plus any future external channels). */
async function notify({ userId, audience, type, title, body = '', data = {}, channels }) {
  if (!userId) return null;
  const doc = await Notification.create({
    userId,
    audience,
    type,
    title,
    body,
    data,
    channels: channels || [NOTIFICATION_CHANNEL.IN_APP],
  });
  if (channels && channels.some((c) => c !== NOTIFICATION_CHANNEL.IN_APP)) {
    dispatchExternal(doc).catch((err) => logger.warn({ err }, 'external notification dispatch failed'));
  }
  return doc;
}

/** Notify all owners and managers (admin audience) — in-app plus any external. */
async function notifyAdmins({ type, title, body = '', data = {} }) {
  const admins = await User.find({ role: { $in: [ROLES.OWNER, ROLES.MANAGER] } }).select('_id');
  const channels = customerChannels();
  await Promise.all(
    admins.map((a) =>
      notify({ userId: a._id, audience: NOTIFICATION_AUDIENCE.ADMIN, type, title, body, data, channels })
    )
  );
}

// ── Domain event helpers ────────────────────────────────────────────────────

async function onBookingCreated(booking) {
  await notifyAdmins({
    type: NOTIFICATION_TYPE.NEW_BOOKING,
    title: `New booking ${booking.bookingNumber}`,
    body: 'A new booking has been created and is awaiting confirmation.',
    data: { bookingId: booking._id },
  });
}

async function onBookingConfirmed(booking) {
  await notify({
    userId: booking.customerId,
    audience: NOTIFICATION_AUDIENCE.CUSTOMER,
    type: NOTIFICATION_TYPE.BOOKING_CONFIRMED,
    title: `Booking ${booking.bookingNumber} confirmed`,
    body: 'Your booking has been confirmed. See you at pickup!',
    data: { bookingId: booking._id },
    channels: customerChannels(),
  });
}

async function onBookingCancelled(booking) {
  await notify({
    userId: booking.customerId,
    audience: NOTIFICATION_AUDIENCE.CUSTOMER,
    type: NOTIFICATION_TYPE.BOOKING_CANCELLED,
    title: `Booking ${booking.bookingNumber} cancelled`,
    body: 'Your booking has been cancelled.',
    data: { bookingId: booking._id },
    channels: customerChannels(),
  });
}

async function onPaymentReceived(payment, booking) {
  await notify({
    userId: booking.customerId,
    audience: NOTIFICATION_AUDIENCE.CUSTOMER,
    type: NOTIFICATION_TYPE.PAYMENT_RECEIVED,
    title: 'Payment received',
    body: `We received a payment of ${payment.amount}.`,
    data: { bookingId: booking._id, paymentId: payment._id },
    channels: customerChannels(),
  });
  await notifyAdmins({
    type: NOTIFICATION_TYPE.PAYMENT_RECEIVED,
    title: `Payment recorded for ${booking.bookingNumber}`,
    body: `Amount ${payment.amount} (${payment.kind}).`,
    data: { bookingId: booking._id, paymentId: payment._id },
  });
}

async function onAgreementGenerated(booking) {
  await notify({
    userId: booking.customerId,
    audience: NOTIFICATION_AUDIENCE.CUSTOMER,
    type: NOTIFICATION_TYPE.AGREEMENT_GENERATED,
    title: 'Rental agreement ready',
    body: `The agreement for booking ${booking.bookingNumber} is available.`,
    data: { bookingId: booking._id },
    channels: customerChannels(),
  });
}

async function onDamageReported(damage) {
  await notifyAdmins({
    type: NOTIFICATION_TYPE.DAMAGE_REPORTED,
    title: 'Damage reported',
    body: `Severity: ${damage.severity}.`,
    data: { damageId: damage._id, vehicleId: damage.vehicleId },
  });
}

async function onEmergency(request) {
  await notifyAdmins({
    type: NOTIFICATION_TYPE.EMERGENCY,
    title: `Emergency: ${request.type}`,
    body: request.description || 'A customer requested emergency assistance.',
    data: { emergencyId: request._id, bookingId: request.bookingId },
  });
}

// ── Reads (per-user inbox) ───────────────────────────────────────────────────

/** List a user's notifications, newest first. */
async function listForUser(userId, { unreadOnly = false, page = 1, limit = 20 } = {}) {
  const filter = { userId };
  if (unreadOnly) filter.readAt = null;
  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);
  return { items, total };
}

async function unreadCount(userId) {
  return Notification.countDocuments({ userId, readAt: null });
}

/** Mark one notification read — only if it belongs to the user. */
async function markRead(id, userId) {
  const doc = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { readAt: new Date() },
    { new: true }
  );
  if (!doc) throw ApiError.notFound('Notification not found');
  return doc;
}

async function markAllRead(userId) {
  const res = await Notification.updateMany({ userId, readAt: null }, { readAt: new Date() });
  return { modified: res.modifiedCount != null ? res.modifiedCount : res.nModified };
}

module.exports = {
  notify,
  notifyAdmins,
  onBookingCreated,
  onBookingConfirmed,
  onBookingCancelled,
  onPaymentReceived,
  onAgreementGenerated,
  onDamageReported,
  onEmergency,
  listForUser,
  unreadCount,
  markRead,
  markAllRead,
};
