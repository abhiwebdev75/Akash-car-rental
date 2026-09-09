/**
 * Shared Joi building blocks reused across resource validation schemas:
 * Mongo ObjectId, pagination/sorting, date and time strings, and a couple of
 * small helpers. Keeping these here keeps per-resource schemas short and
 * consistent.
 */
const Joi = require('joi');

// 24-char hex Mongo ObjectId.
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('must be a valid id');

// "HH:mm" 24-hour time.
const timeString = Joi.string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
  .message('must be a valid HH:mm time');

// Accept an ISO date or "YYYY-MM-DD"; coerced to a Date by Joi.
const dateOnly = Joi.date().iso();

const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('-createdAt'),
};

/** A required objectId path param named `id`. */
const idParam = Joi.object({ id: objectId.required() });

/** Build a `{ id }`-style param schema with a custom key name. */
const paramId = (key = 'id') => Joi.object({ [key]: objectId.required() });

module.exports = {
  Joi,
  objectId,
  timeString,
  dateOnly,
  pagination,
  idParam,
  paramId,
};
