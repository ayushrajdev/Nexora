/**
 * @devtinder/shared — Barrel export
 *
 * Usage in a microservice:
 *   const { logger, getRedisClient, createPublisher } = require('@devtinder/shared');
 */

const logger = require('./logger');
const { getRedisClient, closeRedisConnection } = require('./redis');
const {
    createPublisher,
    createConsumer,
    publishEvent,
} = require('./messageQueue');
const {
    createSession,
    getSession,
    destroySession,
    refreshSession,
    updateSession,
    SESSION_PREFIX,
    DEFAULT_TTL,
} = require('./sessionManager');
const { internalAuth, optionalAuth } = require('./authMiddleware');
const { errorHandler } = require('./errorHandler');
const {
    sendSuccess,
    sendCreated,
    sendNoContent,
} = require('./responseFormatter');
const { createServiceClient } = require('./httpClient');
const {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalError,
} = require('./errors');
const {
    QUEUES,
    EVENTS,
    SERVICES,
    MEMBERSHIP_AMOUNT,
    ALLOWED_PROFILE_UPDATES,
    CONNECTION_STATUS,
    GENDER,
    USER_SAFE_FIELDS,
    COOKIE_NAME,
} = require('./constants');

module.exports = {
    // Logger
    logger,

    // Redis
    getRedisClient,
    closeRedisConnection,

    // Message Queue
    createPublisher,
    createConsumer,
    publishEvent,

    // Sessions
    createSession,
    getSession,
    destroySession,
    refreshSession,
    updateSession,
    SESSION_PREFIX,
    DEFAULT_TTL,

    // Middleware
    internalAuth,
    optionalAuth,
    errorHandler,

    // Response
    sendSuccess,
    sendCreated,
    sendNoContent,

    // HTTP Client
    createServiceClient,

    // Errors
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalError,

    // Constants
    QUEUES,
    EVENTS,
    SERVICES,
    MEMBERSHIP_AMOUNT,
    ALLOWED_PROFILE_UPDATES,
    CONNECTION_STATUS,
    GENDER,
    USER_SAFE_FIELDS,
    COOKIE_NAME,
};
