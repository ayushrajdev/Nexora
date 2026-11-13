import validator from 'validator';
import { ErrorFactory } from '../../core/errors.js';

export const validateSignup = (req, _res, next) => {
  const { firstName, emailId, password } = req.body;
  if (
    !firstName ||
    typeof firstName !== 'string' ||
    firstName.trim().length < 3 ||
    firstName.trim().length > 50
  ) {
    return next(
      ErrorFactory.badRequest('First name must be between 3 and 50 characters')
    );
  }
  if (!emailId || !validator.isEmail(emailId)) {
    return next(ErrorFactory.badRequest('Valid email is required'));
  }
  if (!password || !validator.isStrongPassword(password)) {
    return next(ErrorFactory.badRequest('Please enter a strong password'));
  }
  next();
};

export const validateLogin = (req, _res, next) => {
  const { emailId, password } = req.body;
  if (!emailId || !validator.isEmail(emailId)) {
    return next(ErrorFactory.badRequest('Valid email is required'));
  }
  if (!password || typeof password !== 'string') {
    return next(ErrorFactory.badRequest('Password is required'));
  }
  next();
};
