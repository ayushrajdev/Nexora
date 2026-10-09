const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50, // Stricter limit for auth routes
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter
};
