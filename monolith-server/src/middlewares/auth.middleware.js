import {
  getSessionFromStore,
  refreshSessionInStore,
} from '../core/sessionStore.js';
import { COOKIE_NAME } from '../core/constants.js';
import { ErrorFactory } from '../core/errors.js';

/**
 * Zero-Trust Header Sanitizer Middleware:
 * Strips any incoming spoofed `x-user-*` headers before authentication runs.
 */
export const sanitizeHeaders = (req, _res, next) => {
  Object.keys(req.headers).forEach((header) => {
    if (header.toLowerCase().startsWith('x-user-')) {
      delete req.headers[header];
    }
  });
  next();
};

/**
 * Monolith Session Authentication Middleware:
 * Validates the HTTP-only `sid` cookie against the active SessionStoreStrategy,
 * refreshes session TTL, populates `req.user`, and sets `x-user-*` headers.
 */
export const sessionAuth = async (req, _res, next) => {
  try {
    const sid = req.cookies?.[COOKIE_NAME] || req.cookies?.sid;

    if (!sid) {
      throw ErrorFactory.unauthorized('Authentication required');
    }

    const session = await getSessionFromStore(sid);
    if (!session) {
      throw ErrorFactory.unauthorized('Session expired or invalid');
    }

    await refreshSessionInStore(sid);

    req.user = {
      _id: session.userId,
      email: session.email,
      firstName: session.firstName,
      lastName: session.lastName || '',
      isPremium: Boolean(session.isPremium),
      membershipType: session.membershipType || null,
    };

    req.headers['x-user-id'] = session.userId;
    req.headers['x-user-email'] = session.email || '';
    req.headers['x-user-name'] = session.firstName || '';
    req.headers['x-user-premium'] = session.isPremium ? 'true' : 'false';
    req.headers['x-user-membership'] = session.membershipType || 'free';

    next();
  } catch (err) {
    next(err);
  }
};

export default sessionAuth;
