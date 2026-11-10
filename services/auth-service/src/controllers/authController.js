import authService from '../services/authService.js';
import { sendSuccess, sendCreated, sendNoContent } from '@devtinder/shared';

export class AuthController {
  async signup(req, res, next) {
    try {
      const user = await authService.signup(req.body, req, res);
      sendCreated(res, { user }, 'User created successfully');
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const user = await authService.login(req.body, req, res);
      sendSuccess(res, { user }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req, res);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;
