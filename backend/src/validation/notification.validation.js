/**
 * Notification validation — inbox listing filters.
 */
const { Joi } = require('./common');

const list = {
  query: Joi.object({
    unreadOnly: Joi.boolean().default(false),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = { list };
