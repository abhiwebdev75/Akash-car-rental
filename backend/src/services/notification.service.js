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
const {
  ROLES,
  NOTIFICATION_AUDIENCE,
  NOTIFICATION_TYPE,
  NOTIFICATION_CHANNEL,
} = require('../config/constants');

/** Placeholder for future external delivery (email/WhatsApp/SMS). */
async function dispatchExternal(/* notification */) {
  // Intentionally a no-op for now. Wire real providers here later.
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

/** Notify all owners and managers (admin audience). */
async function notifyAdmins({ type, title, body = '', data = {} }) {
  const admins = await User.find({ role: { $in: [ROLES.OWNER, ROLES.MANAGER] } }).select('_id');
  await Promise.all(
    admins.map((a) =>
      notify({ userId: a._id, audience: NOTIFICATION_AUDIENCE.ADMIN, type, title, body, data })
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
