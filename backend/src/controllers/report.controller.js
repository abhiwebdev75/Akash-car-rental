/**
 * Reports controller. All figures come from the database (the source of truth);
 * the client only supplies range/filter. Location-scoped staff (MANAGER/STAFF)
 * are transparently restricted to their assigned location. Each endpoint can
 * emit CSV via ?format=csv.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const reportService = require('../services/report.service');
const { isLocationScoped } = require('../middleware/rbac.middleware');

/** Resolve the effective locationId, forcing scoped staff to their location. */
function scopedLocation(req) {
  if (isLocationScoped(req.user)) return String(req.user.assignedLocation);
  return req.query.locationId;
}

function sendCsv(res, filename, rows, columns) {
  const csv = reportService.toCSV(rows, columns);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csv);
}

const revenue = asyncHandler(async (req, res) => {
  const { from, to, format } = req.query;
  const data = await reportService.revenueReport({ from, to, locationId: scopedLocation(req) });
  if (format === 'csv') {
    return sendCsv(res, 'revenue.csv', data.byDay, ['date', 'revenue', 'payments']);
  }
  return sendSuccess(res, data);
});

const bookings = asyncHandler(async (req, res) => {
  const { from, to, format } = req.query;
  const data = await reportService.bookingsReport({ from, to, locationId: scopedLocation(req) });
  if (format === 'csv') {
    const rows = Object.entries(data.byStatus).map(([status, v]) => ({
      status,
      count: v.count,
      value: v.value,
    }));
    return sendCsv(res, 'bookings.csv', rows, ['status', 'count', 'value']);
  }
  return sendSuccess(res, data);
});

const utilization = asyncHandler(async (req, res) => {
  const { from, to, format } = req.query;
  const data = await reportService.fleetUtilization({ from, to, locationId: scopedLocation(req) });
  if (format === 'csv') {
    return sendCsv(res, 'utilization.csv', data.perVehicle, [
      'vehicle',
      'registrationNumber',
      'bookedDays',
      'utilization',
    ]);
  }
  return sendSuccess(res, data);
});

const outstanding = asyncHandler(async (req, res) => {
  const { format } = req.query;
  const data = await reportService.outstandingPayments({ locationId: scopedLocation(req) });
  if (format === 'csv') {
    return sendCsv(res, 'outstanding.csv', data.rows, [
      'bookingNumber',
      'customer',
      'phone',
      'totalAmount',
      'amountPaid',
      'outstanding',
      'paymentStatus',
    ]);
  }
  return sendSuccess(res, data);
});

module.exports = { revenue, bookings, utilization, outstanding };
