const validator = require('validator');
const { BadRequestError } = require('@devtinder/shared');

const validateSignup = (req, res, next) => {
  const { firstName, emailId, password } = req.body;
  if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 3 || firstName.trim().length > 50) {
    return next(new BadRequestError('First name must be between 3 and 50 characters'));
  }
  if (!emailId || !validator.isEmail(emailId)) {
    return next(new BadRequestError('Valid email is required'));
  }
  if (!password || !validator.isStrongPassword(password)) {
    return next(new BadRequestError('Please enter a strong password'));
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { emailId, password } = req.body;
  if (!emailId || !validator.isEmail(emailId)) {
    return next(new BadRequestError('Valid email is required'));
  }
  if (!password || typeof password !== 'string') {
    return next(new BadRequestError('Password is required'));
  }
  next();
};

module.exports = {
  validateSignup,
  validateLogin
};
