/**
 * Server bootstrap. Validates configuration, connects to MongoDB (Atlas), then
 * starts the HTTP listener. Handles graceful shutdown on SIGINT/SIGTERM and
 * fails loudly on unhandled errors. Importing app separately keeps tests fast
 * (they never start a listener).
 */
const http = require('http');
const app = require('./app');
const { config, validateConfig } = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const logger = require('./utils/logger');

let server;

async function start() {
  // Fail fast if critical secrets/URIs are missing.
  validateConfig();

  await connectDB();

  server = http.createServer(app);
  server.listen(config.port, () => {
    logger.info(`🚗 Car Rental API listening on port ${config.port} (${config.env})`);
  });
}

/** Close the HTTP server and DB connection cleanly. */
async function shutdown(signal) {
  logger.warn(`${signal} received — shutting down gracefully`);
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception — exiting');
  process.exit(1);
});

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
