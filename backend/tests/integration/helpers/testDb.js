/**
 * Integration-test database helper. Spins up an in-memory MongoDB server and
 * connects the app's real Mongoose connection to it, so tests exercise the
 * genuine models/services without touching a real Atlas cluster.
 *
 * Note on transactions: a single in-memory server is not a replica set, so the
 * booking service's `withTransaction` transparently falls back to a session-less
 * path (its double-booking re-check still runs). To exercise the true
 * transactional path, swap MongoMemoryServer for MongoMemoryReplSet.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB, disconnectDB, mongoose } = require('../../../src/config/db');

let mongod;

async function setupTestDB() {
  mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri());
}

async function teardownTestDB() {
  await disconnectDB();
  if (mongod) await mongod.stop();
}

/** Remove all documents between tests for isolation. */
async function clearDB() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

module.exports = { setupTestDB, teardownTestDB, clearDB, mongoose };
