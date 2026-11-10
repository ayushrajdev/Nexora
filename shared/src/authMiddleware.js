import { UnauthorizedError } from './errors.js';

/**
 * Middleware for downstream services (behind API Gateway).
 * Reads user identity from headers set by the gateway.
 *
 * The API Gateway validates the session cookie and injects:
 *   - X-User-Id
 *   - X-User-Email
 *   - X-User-Name
 *   - X-User-Premium
 *   - X-User-Membership
 */
export const internalAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return next(new UnauthorizedError('Authentication required'));
  }

  req.user = {
    _id: userId,
    emailId: req.headers['x-user-email'] || '',
    firstName: req.headers['x-user-name'] || '',
    isPremium: req.headers['x-user-premium'] === 'true',
    membershipType: req.headers['x-user-membership'] || null,
  };

  next();
};

/**
 * Middleware that allows unauthenticated access but still populates
 * req.user if headers are present (for optional-auth routes).
 */
export const optionalAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'];

  if (userId) {
    req.user = {
      _id: userId,
      emailId: req.headers['x-user-email'] || '',
      firstName: req.headers['x-user-name'] || '',
      isPremium: req.headers['x-user-premium'] === 'true',
      membershipType: req.headers['x-user-membership'] || null,
    };
  }

  next();
};
