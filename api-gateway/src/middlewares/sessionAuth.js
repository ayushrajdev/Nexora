const { getSession, refreshSession, COOKIE_NAME, UnauthorizedError } = require('@devtinder/shared');

const sessionAuth = async (req, res, next) => {
  try {
    const sid = req.cookies[COOKIE_NAME] || req.cookies['sid'];
    
    if (!sid) {
      throw new UnauthorizedError('Authentication required');
    }

    const session = await getSession(sid);
    
    if (!session) {
      throw new UnauthorizedError('Session expired or invalid');
    }

    // Refresh session TTL
    await refreshSession(sid);

    // Inject headers for downstream services
    req.headers['x-user-id'] = session.userId;
    req.headers['x-user-email'] = session.email;
    req.headers['x-user-name'] = session.firstName;
    req.headers['x-user-premium'] = session.isPremium ? 'true' : 'false';
    req.headers['x-user-membership'] = session.membershipType || 'free';

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = sessionAuth;
