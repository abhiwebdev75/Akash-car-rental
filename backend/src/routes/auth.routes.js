/**
 * Auth routes — mounted at /api/auth. Registration/login are rate-limited to
 * blunt brute-force attempts.
 */
const express = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/auth.validation');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/register', authLimiter, validate(schema.register), controller.register);
router.post('/verify-email', authLimiter, validate(schema.verifyEmail), controller.verifyEmail);
router.post('/resend-verification', authLimiter, validate(schema.resendVerification), controller.resendVerification);
router.post('/login', authLimiter, validate(schema.login), controller.login);
router.post('/forgot-password', authLimiter, validate(schema.forgotPassword), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(schema.resetPassword), controller.resetPassword);
router.post('/refresh', validate(schema.refresh), controller.refresh);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);
router.post('/change-password', authenticate, validate(schema.changePassword), controller.changePassword);

module.exports = router;
