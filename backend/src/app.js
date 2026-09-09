/**
 * Express application assembly. This module builds and exports the configured
 * `app` WITHOUT starting a listener, so it can be imported directly by
 * integration tests (supertest) and by server.js for real startup.
 *
 * Order matters: security headers → CORS → body/cookie parsing → sanitization →
 * logging → rate limiting → routes → 404 → centralized error handler (last).
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const { config } = require('./config/env');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const apiRoutes = require('./routes');

// Ensure all Mongoose models are registered (populate() needs them) even if a
// code path reaches a model before its controller/service has been required.
require('./models');

const app = express();

// Behind a proxy/load balancer (Render, Heroku, Nginx) so rate-limit and secure
// cookies see the real client IP and protocol.
app.set('trust proxy', 1);

// ── Security & platform middleware ───────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin/non-browser requests (no Origin header) and any
      // explicitly whitelisted client URL. Empty whitelist = allow all (dev).
      if (!origin || config.clientUrls.length === 0 || config.clientUrls.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Strip keys containing `$`/`.` to prevent NoSQL operator injection.
app.use(mongoSanitize());

// Request logging (skipped when logger is silent, i.e. tests).
if (!config.isTest) {
  app.use(
    morgan('tiny', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// ── Health check (before rate limiter so probes are never throttled) ─────────
app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', env: config.env, time: new Date().toISOString() });
});

// ── API ──────────────────────────────────────────────────────────────────────
app.use('/api', apiLimiter, apiRoutes);

// ── 404 + centralized error handling (must be last) ──────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
