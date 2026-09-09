/**
 * API router — mounts every resource router under /api. Kept separate from
 * app.js so the Express assembly (security, parsing, error handling) stays
 * readable and the full surface area is visible in one place.
 */
const express = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const locationRoutes = require('./location.routes');
const addonRoutes = require('./addon.routes');
const vehicleRoutes = require('./vehicle.routes');
const bookingRoutes = require('./booking.routes');
const paymentRoutes = require('./payment.routes');
const inspectionRoutes = require('./inspection.routes');
const agreementRoutes = require('./agreement.routes');
const maintenanceRoutes = require('./maintenance.routes');
const transferRoutes = require('./transfer.routes');
const damageRoutes = require('./damage.routes');
const emergencyRoutes = require('./emergency.routes');
const reviewRoutes = require('./review.routes');
const couponRoutes = require('./coupon.routes');
const notificationRoutes = require('./notification.routes');
const documentRoutes = require('./document.routes');
const uploadRoutes = require('./upload.routes');
const reportRoutes = require('./report.routes');
const settingsRoutes = require('./settings.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/locations', locationRoutes);
router.use('/add-ons', addonRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/agreements', agreementRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/transfers', transferRoutes);
router.use('/damages', damageRoutes);
router.use('/emergencies', emergencyRoutes);
router.use('/reviews', reviewRoutes);
router.use('/coupons', couponRoutes);
router.use('/notifications', notificationRoutes);
router.use('/documents', documentRoutes);
router.use('/uploads', uploadRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
