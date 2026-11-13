import env from '../config/env.js';
import logger from '../core/logger.js';
import { AppError } from '../core/errors.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: 'Validation error',
      errors: messages,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    return res.status(409).json({
      success: false,
      status: 'fail',
      message: `Duplicate value for: ${field}`,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }

  logger.error('Unhandled error in monolith server:', err);
  return res.status(500).json({
    success: false,
    status: 'error',
    message:
      env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
};

export default errorHandler;
