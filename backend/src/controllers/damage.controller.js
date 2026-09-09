/**
 * Damage controller. Staff report and manage vehicle damage; admins are
 * notified. Photos are already-uploaded references submitted in the body.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/ApiResponse');
const damageService = require('../services/damage.service');

const report = asyncHandler(async (req, res) => {
  const damage = await damageService.reportDamage({ ...req.body, reportedBy: req.user._id });
  return sendCreated(res, damage, { message: 'Damage reported' });
});

const list = asyncHandler(async (req, res) => {
  const damages = await damageService.listDamages({
    vehicleId: req.query.vehicleId,
    bookingId: req.query.bookingId,
    status: req.query.status,
  });
  return sendSuccess(res, damages);
});

const getById = asyncHandler(async (req, res) => {
  const damage = await damageService.getById(req.params.id);
  return sendSuccess(res, damage);
});

const update = asyncHandler(async (req, res) => {
  const damage = await damageService.updateDamage(req.params.id, req.body);
  return sendSuccess(res, damage, { message: 'Damage updated' });
});

module.exports = { report, list, getById, update };
