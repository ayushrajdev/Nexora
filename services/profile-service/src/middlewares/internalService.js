import { UnauthorizedError } from '@devtinder/shared';

export const verifyInternalService = (req, res, next) => {
  const internalSecret = req.headers['x-internal-service'];
  if (
    internalSecret !== process.env.INTERNAL_SERVICE_SECRET &&
    process.env.NODE_ENV === 'production'
  ) {
    return next(new UnauthorizedError('Unauthorized access'));
  }
  next();
};

export default verifyInternalService;
