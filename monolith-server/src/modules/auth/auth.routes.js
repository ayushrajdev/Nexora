import express from 'express';
import authController from './auth.controller.js';
import { validateLogin, validateSignup } from './auth.validator.js';
import { sessionAuth } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimit.middleware.js';

const router = express.Router();

router.post('/signup', authLimiter, validateSignup, authController.signup);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/logout', sessionAuth, authController.logout);

router.get('/oauth/google', authLimiter, authController.googleRedirect);
router.get(
  '/oauth/google/callback',
  authLimiter,
  authController.googleCallback
);
router.get('/oauth/github', authLimiter, authController.githubRedirect);
router.get(
  '/oauth/github/callback',
  authLimiter,
  authController.githubCallback
);

export default router;
