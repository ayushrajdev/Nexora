import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import env from '../config/env.js';
import logger from './logger.js';
import { SESSION_PREFIX } from './constants.js';

/**
 * Strategy Pattern Interface for Session Storage:
 * - set(key, value, ttlSeconds)
 * - get(key)
 * - del(key)
 * - expire(key, ttlSeconds)
 * - ttl(key)
 */

/**
 * Concrete Strategy 1: In-Memory Session Store Strategy
 */
export class InMemorySessionStoreStrategy {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  async set(key, val, mode, ttl) {
    this.store.set(key, val);
    if (mode === 'EX' && ttl) {
      this.ttls.set(key, ttl);
    }
  }

  async get(key) {
    return this.store.get(key) ?? null;
  }

  async del(key) {
    this.store.delete(key);
    this.ttls.delete(key);
  }

  async expire(key, ttl) {
    if (this.store.has(key)) {
      this.ttls.set(key, ttl);
      return 1;
    }
    return 0;
  }

  async ttl(key) {
    return this.ttls.get(key) ?? env.SESSION_TTL;
  }

  clear() {
    this.store.clear();
    this.ttls.clear();
  }
}

/**
 * Concrete Strategy 2: Redis Session Store Strategy
 */
export class RedisSessionStoreStrategy {
  constructor(redisClient) {
    this.client =
      redisClient ||
      new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
        retryStrategy: (times) => {
          if (times > 5) return null;
          return Math.min(times * 200, 2000);
        },
      });

    if (!redisClient) {
      this.client.on('connect', () => logger.info('Monolith Redis connected'));
      this.client.on('error', (err) =>
        logger.error('Monolith Redis error:', { error: err.message })
      );
    }
  }

  async set(key, val, mode = 'EX', ttl = env.SESSION_TTL) {
    return this.client.set(key, val, mode, ttl);
  }

  async get(key) {
    return this.client.get(key);
  }

  async del(key) {
    return this.client.del(key);
  }

  async expire(key, ttl) {
    return this.client.expire(key, ttl);
  }

  async ttl(key) {
    if (typeof this.client.ttl === 'function') {
      return this.client.ttl(key);
    }
    return env.SESSION_TTL;
  }
}

/**
 * SessionStoreFactory — Factory Pattern to instantiate the configured SessionStoreStrategy.
 */
export class SessionStoreFactory {
  static create(type = env.SESSION_STORE_TYPE, customClient = null) {
    if (customClient) {
      return customClient;
    }
    if (type === 'redis') {
      return new RedisSessionStoreStrategy();
    }
    return new InMemorySessionStoreStrategy();
  }
}

let activeStore = SessionStoreFactory.create();

export const getSessionStore = () => activeStore;

export const setSessionStore = (customStore) => {
  activeStore = customStore;
};

export const createSessionInStore = async (
  userData,
  ttl = env.SESSION_TTL
) => {
  const sessionId = uuidv4();
  const store = getSessionStore();

  const sessionData = {
    userId: (userData.userId || userData._id).toString(),
    email: userData.email || userData.emailId,
    firstName: userData.firstName,
    lastName: userData.lastName || '',
    isPremium: Boolean(userData.isPremium),
    membershipType: userData.membershipType || null,
    createdAt: new Date().toISOString(),
  };

  await store.set(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify(sessionData),
    'EX',
    ttl
  );

  logger.info(`Session created: ${sessionId} for user ${sessionData.userId}`);
  return { sessionId, sessionData };
};

export const getSessionFromStore = async (sessionId) => {
  const store = getSessionStore();
  const raw = await store.get(`${SESSION_PREFIX}${sessionId}`);
  return raw ? JSON.parse(raw) : null;
};

export const destroySessionFromStore = async (sessionId) => {
  const store = getSessionStore();
  await store.del(`${SESSION_PREFIX}${sessionId}`);
  logger.info(`Session destroyed: ${sessionId}`);
};

export const refreshSessionInStore = async (
  sessionId,
  ttl = env.SESSION_TTL
) => {
  const store = getSessionStore();
  await store.expire(`${SESSION_PREFIX}${sessionId}`, ttl);
};

export const updateSessionInStore = async (sessionId, updates) => {
  const store = getSessionStore();
  const existing = await getSessionFromStore(sessionId);
  if (!existing) return null;

  const updated = { ...existing, ...updates };
  const ttl =
    typeof store.ttl === 'function'
      ? await store.ttl(`${SESSION_PREFIX}${sessionId}`)
      : env.SESSION_TTL;

  await store.set(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify(updated),
    'EX',
    ttl > 0 ? ttl : env.SESSION_TTL
  );

  return updated;
};
