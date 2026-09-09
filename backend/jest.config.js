/**
 * Jest configuration — integration tests only (the pure unit tests run under the
 * built-in node:test runner via `npm run test:unit`).
 *
 * Integration tests spin up an in-memory MongoDB (mongodb-memory-server) and
 * exercise the real Express app end-to-end with supertest.
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.js'],
  // Generous timeout: the first run downloads a MongoDB binary for the
  // in-memory server.
  testTimeout: 60000,
  // Quiet the app's request logger etc. during tests.
  silent: false,
};
