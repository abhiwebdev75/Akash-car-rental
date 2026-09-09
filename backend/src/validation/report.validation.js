/**
 * Report validation — all reports accept an optional date range and location
 * filter. Figures are always computed from the database, never the client.
 */
const { Joi, objectId } = require('./common');

const range = {
  query: Joi.object({
    from: Joi.date().iso(),
    to: Joi.date().iso().greater(Joi.ref('from')),
    locationId: objectId,
    // For CSV-capable endpoints.
    format: Joi.string().valid('json', 'csv').default('json'),
  }),
};

module.exports = { range };
