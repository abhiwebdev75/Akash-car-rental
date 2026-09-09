/**
 * Generic Joi validation middleware. Pass an object with any of
 * { params, query, body } Joi schemas. Validated + coerced values replace the
 * originals; unknown keys are stripped. All failures are collected and returned
 * as a single 400 with field-level detail.
 *
 * Backend validation is mandatory — values from the browser are never trusted.
 */
const ApiError = require('../utils/ApiError');

const PARTS = ['params', 'query', 'body'];

function validate(schema) {
  return (req, _res, next) => {
    const errors = [];
    for (const part of PARTS) {
      if (!schema[part]) continue;
      const { value, error } = schema[part].validate(req[part], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        for (const d of error.details) {
          errors.push({ field: d.path.join('.'), message: d.message.replace(/"/g, ''), in: part });
        }
      } else {
        req[part] = value;
      }
    }
    if (errors.length) {
      return next(ApiError.badRequest('Validation failed', { errors, code: 'VALIDATION_ERROR' }));
    }
    return next();
  };
}

module.exports = validate;
