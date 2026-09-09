/**
 * Notification model — internal notifications for customers and admins. The
 * `channels` field records where a notification should be (or was) dispatched;
 * the notification service currently persists IN_APP records and exposes hooks
 * so EMAIL / WHATSAPP / SMS delivery can be plugged in later.
 */
const { Schema, model } = require('mongoose');
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_AUDIENCE,
  NOTIFICATION_CHANNEL,
  enumValues,
} = require('../config/constants');

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    audience: { type: String, enum: enumValues(NOTIFICATION_AUDIENCE), required: true },
    type: { type: String, enum: enumValues(NOTIFICATION_TYPE), required: true, index: true },
    title: { type: String, required: true },
    body: String,
    data: { type: Schema.Types.Mixed, default: {} }, // ids for deep-linking
    channels: {
      type: [String],
      enum: enumValues(NOTIFICATION_CHANNEL),
      default: [NOTIFICATION_CHANNEL.IN_APP],
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Fast "my unread notifications" lookups.
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

module.exports = model('Notification', notificationSchema);
