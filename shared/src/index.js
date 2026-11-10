/**
 * @devtinder/shared — Barrel export (ES Modules)
 *
 * Usage in a microservice:
 *   import { logger, getRedisClient, createPublisher } from '@devtinder/shared';
 */

export { logger, default as defaultLogger } from './logger.js';
export { getRedisClient, setRedisClient, closeRedisConnection } from './redis.js';
export {
  createPublisher,
  createConsumer,
  publishEvent,
  closePublishers,
} from './messageQueue.js';
export {
  createSession,
  getSession,
  destroySession,
  refreshSession,
  updateSession,
  SESSION_PREFIX,
  DEFAULT_TTL,
} from './sessionManager.js';
export { internalAuth, optionalAuth } from './authMiddleware.js';
export { errorHandler } from './errorHandler.js';
export {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from './responseFormatter.js';
export { createServiceClient } from './httpClient.js';
export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalError,
} from './errors.js';
export {
  QUEUES,
  EVENTS,
  SERVICES,
  MEMBERSHIP_AMOUNT,
  ALLOWED_PROFILE_UPDATES,
  CONNECTION_STATUS,
  GENDER,
  USER_SAFE_FIELDS,
  COOKIE_NAME,
} from './constants.js';
