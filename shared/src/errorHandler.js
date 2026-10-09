const logger = require('./logger');
const { AppError } = require('./errors');

/**
 * Global Express error-handling middleware.
 * Must be registered last (after all routes).
 *
 * - Operational errors (AppError subclasses) → client-safe response
 * - Unexpected errors → 500 with generic message
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: 'Validation error',
      errors: messages,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    return res.status(409).json({
      success: false,
      status: 'fail',
      message: `Duplicate value for: ${field}`,
    });
  }

  // Known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }

  // Unknown / programmer errors
  logger.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    status: 'error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : err.message,
  });
};

module.exports = { errorHandler };
