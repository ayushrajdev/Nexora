import Redis from 'ioredis';
import logger from './logger.js';

/** @type {Redis | null} */
let client = null;

/**
 * Returns a singleton Redis client.
 * Creates the connection on first call and reuses it thereafter.
 */
export const getRedisClient = () => {
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
 * Allows injecting a mock or custom Redis client (useful for unit/integration testing).
 * @param {any} customClient
 */
export const setRedisClient = (customClient) => {
  client = customClient;
};

/**
 * Gracefully close the Redis connection.
 */
export const closeRedisConnection = async () => {
  if (client) {
    await client.quit();
    client = null;
    logger.info('Redis connection closed');
  }
};
