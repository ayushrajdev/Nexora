import { logger } from '@devtinder/shared';

const errorHandler = (err, req, res, _next) => {
  logger.error(`[API Gateway] Error: ${err.message}`, { error: err.stack, path: req.path });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
    },
  });
};

export default errorHandler;
export { errorHandler };
