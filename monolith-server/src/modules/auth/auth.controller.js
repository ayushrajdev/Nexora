import authService from './auth.service.js';
import {
  sendCreated,
  sendNoContent,
  sendSuccess,
} from '../../core/responseFormatter.js';
import env from '../../config/env.js';

export class AuthController {
  constructor(service = authService) {
    this.service = service;
  }

  signup = async (req, res, next) => {
    try {
      const user = await this.service.signup(req.body, req, res);
      sendCreated(res, { user }, 'User created successfully');
    } catch (err) {
      next(err);
    }
  };

  login = async (req, res, next) => {
    try {
      const user = await this.service.login(req.body, req, res);
      sendSuccess(res, { user }, 'Login successful');
    } catch (err) {
      next(err);
    }
  };

  logout = async (req, res, next) => {
    try {
      await this.service.logout(req, res);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  };

  googleRedirect = async (_req, res, next) => {
    try {
      const url = this.service.getOAuthUrl('google');
      res.redirect(url);
    } catch (err) {
      next(err);
    }
  };

  googleCallback = async (req, res, next) => {
    try {
      const { code } = req.query;
      await this.service.handleOAuthCallback('google', code, req, res);
      res.redirect(env.FRONT_END_URL);
    } catch (err) {
      next(err);
    }
  };

  githubRedirect = async (_req, res, next) => {
    try {
      const url = this.service.getOAuthUrl('github');
      res.redirect(url);
    } catch (err) {
      next(err);
    }
  };

  githubCallback = async (req, res, next) => {
    try {
      const { code } = req.query;
      await this.service.handleOAuthCallback('github', code, req, res);
      res.redirect(env.FRONT_END_URL);
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
export default authController;
