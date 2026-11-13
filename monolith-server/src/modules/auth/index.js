import Session from './session.model.js';
import sessionRepository, { SessionRepository } from './session.repository.js';
import {
  OAuthStrategyFactory,
  GoogleOAuthStrategy,
  GithubOAuthStrategy,
} from './oauth.strategy.js';
import authService, { AuthService } from './auth.service.js';
import authController, { AuthController } from './auth.controller.js';
import { validateLogin, validateSignup } from './auth.validator.js';
import authRoutes from './auth.routes.js';

export {
  Session,
  SessionRepository,
  sessionRepository,
  OAuthStrategyFactory,
  GoogleOAuthStrategy,
  GithubOAuthStrategy,
  AuthService,
  authService,
  AuthController,
  authController,
  validateLogin,
  validateSignup,
  authRoutes,
};
