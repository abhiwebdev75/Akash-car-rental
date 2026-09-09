/**
 * Maintenance controller. Staff schedule and progress maintenance; the service
 * guarantees a maintenance window never overlaps a blocking booking and keeps
 * the vehicle status snapshot in sync.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/ApiResponse');
const maintenanceService = require('../services/maintenance.service');

const schedule = asyncHandler(async (req, res) => {
  const record = await maintenanceService.scheduleMaintenance({
    ...req.body,
    performedBy: req.user._id,
  });
  return sendCreated(res, record, { message: 'Maintenance scheduled' });
});

const start = asyncHandler(async (req, res) => {
  const record = await maintenanceService.startMaintenance(req.params.id);
  return sendSuccess(res, record, { message: 'Maintenance started' });
});

const complete = asyncHandler(async (req, res) => {
  const record = await maintenanceService.completeMaintenance(req.params.id, req.body);
  return sendSuccess(res, record, { message: 'Maintenance completed' });
});

const cancel = asyncHandler(async (req, res) => {
  const record = await maintenanceService.cancelMaintenance(req.params.id);
  return sendSuccess(res, record, { message: 'Maintenance cancelled' });
});

const list = asyncHandler(async (req, res) => {
  const records = await maintenanceService.listMaintenance({
    vehicleId: req.query.vehicleId,
    status: req.query.status,
  });
  return sendSuccess(res, records);
});

module.exports = { schedule, start, complete, cancel, list };
