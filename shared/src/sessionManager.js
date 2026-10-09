const { v4: uuidv4 } = require('uuid');
const { getRedisClient } = require('./redis');
const logger = require('./logger');

const SESSION_PREFIX = 'session:';
const DEFAULT_TTL = parseInt(process.env.SESSION_TTL, 10) || 86400; // 24 hours

/**
 * Create a new session in Redis.
 * @param {object} userData - User data to store in the session
 * @param {number} [ttl]   - TTL in seconds (default 24h)
 * @returns {{ sessionId: string, sessionData: object }}
 */
const createSession = async (userData, ttl = DEFAULT_TTL) => {
  const sessionId = uuidv4();
  const redis = getRedisClient();

  const sessionData = {
    userId: userData.userId || userData._id,
    email: userData.email || userData.emailId,
    firstName: userData.firstName,
    isPremium: userData.isPremium || false,
    membershipType: userData.membershipType || null,
    createdAt: new Date().toISOString(),
  };

  await redis.set(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify(sessionData),
    'EX',
    ttl
  );

  logger.info(`Session created: ${sessionId} for user ${sessionData.userId}`);
  return { sessionId, sessionData };
};

/**
 * Retrieve a session from Redis.
 * @param {string} sessionId
 * @returns {object|null}
 */
const getSession = async (sessionId) => {
  const redis = getRedisClient();
  const data = await redis.get(`${SESSION_PREFIX}${sessionId}`);
  return data ? JSON.parse(data) : null;
};

/**
 * Destroy a session from Redis.
 * @param {string} sessionId
 */
const destroySession = async (sessionId) => {
  const redis = getRedisClient();
  await redis.del(`${SESSION_PREFIX}${sessionId}`);
  logger.info(`Session destroyed: ${sessionId}`);
};

/**
 * Refresh the TTL of an existing session.
 * @param {string} sessionId
 * @param {number} [ttl]
 */
const refreshSession = async (sessionId, ttl = DEFAULT_TTL) => {
  const redis = getRedisClient();
  await redis.expire(`${SESSION_PREFIX}${sessionId}`, ttl);
};

/**
 * Update session data in Redis (e.g., after premium upgrade).
 * @param {string} sessionId
 * @param {object} updates - Partial fields to merge into existing session
 */
const updateSession = async (sessionId, updates) => {
  const redis = getRedisClient();
  const existing = await getSession(sessionId);
  if (!existing) return null;

  const updated = { ...existing, ...updates };
  const ttl = await redis.ttl(`${SESSION_PREFIX}${sessionId}`);
  await redis.set(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify(updated),
    'EX',
    ttl > 0 ? ttl : DEFAULT_TTL
  );

  return updated;
};

module.exports = {
  createSession,
  getSession,
  destroySession,
  refreshSession,
  updateSession,
  SESSION_PREFIX,
  DEFAULT_TTL,
};
