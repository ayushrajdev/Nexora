const Redis = require('ioredis');
const logger = require('./logger');

/** @type {Redis | null} */
let client = null;

/**
 * Returns a singleton Redis client.
 * Creates the connection on first call and reuses it thereafter.
 */
const getRedisClient = () => {
  if (!client) {
    client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null, // Required for BullMQ compatibility
      retryStrategy: (times) => {
        if (times > 10) return null; // Stop retrying after 10 attempts
        return Math.min(times * 200, 5000);
      },
    });

    client.on('connect', () => logger.info('Redis connected'));
    client.on('error', (err) => logger.error('Redis error:', err.message));
  }
  return client;
};

/**
 * Gracefully close the Redis connection.
 */
const closeRedisConnection = async () => {
  if (client) {
    await client.quit();
    client = null;
    logger.info('Redis connection closed');
  }
};

module.exports = { getRedisClient, closeRedisConnection };
