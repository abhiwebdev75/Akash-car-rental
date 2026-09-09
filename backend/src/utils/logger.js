/**
 * Structured logger (pino). Pretty-prints in development, JSON in production.
 * Silent during tests to keep test output clean.
 */
const pino = require('pino');
const { config } = require('../config/env');

const logger = pino({
  level: config.isTest ? 'silent' : config.isProd ? 'info' : 'debug',
  transport: config.isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
      },
});

module.exports = logger;
