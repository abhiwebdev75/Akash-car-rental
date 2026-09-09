/**
 * Notification controller — a per-user inbox. Users only ever see their own
 * notifications (the service scopes every query to req.user._id).
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/ApiResponse');
const notificationService = require('../services/notification.service');

const list = asyncHandler(async (req, res) => {
  const { page, limit, unreadOnly } = req.query;
  const { items, total } = await notificationService.listForUser(req.user._id, {
    unreadOnly,
    page,
    limit,
  });
  return sendPaginated(res, items, { page, limit, total });
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.unreadCount(req.user._id);
  return sendSuccess(res, { count });
});

const markRead = asyncHandler(async (req, res) => {
  const doc = await notificationService.markRead(req.params.id, req.user._id);
  return sendSuccess(res, doc, { message: 'Marked as read' });
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user._id);
  return sendSuccess(res, result, { message: 'All notifications marked as read' });
});

module.exports = { list, unreadCount, markRead, markAllRead };
