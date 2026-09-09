/**
 * Mongoose connection management for MongoDB Atlas.
 * The app never calls mongoose.connect directly — it goes through here so
 * connection options, logging, and graceful shutdown live in one place.
 */
const mongoose = require('mongoose');
const { config } = require('./env');
const logger = require('../utils/logger');

// Buffer commands until the connection is ready (default true) but surface
// slow/failed connections quickly.
mongoose.set('strictQuery', true);

let isConnected = false;

/**
 * Connect to MongoDB. `uri` overrides the configured URI (used by tests that
 * spin up an in-memory server).
 */
async function connectDB(uri = config.db.uri) {
  if (isConnected) return mongoose.connection;
  if (!uri) throw new Error('connectDB: no MongoDB URI provided.');

  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
    autoIndex: !config.isProd, // build indexes automatically outside production
  });

  isConnected = true;
  return mongoose.connection;
}

async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

module.exports = { connectDB, disconnectDB, mongoose };
