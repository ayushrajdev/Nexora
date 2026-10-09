const { UnauthorizedError } = require('@devtinder/shared');

const verifyInternalService = (req, res, next) => {
  const internalSecret = req.headers['x-internal-service'];
  if (internalSecret !== process.env.INTERNAL_SERVICE_SECRET && process.env.NODE_ENV === 'production') {
    return next(new UnauthorizedError('Unauthorized access'));
  }
  next();
};

module.exports = verifyInternalService;\n