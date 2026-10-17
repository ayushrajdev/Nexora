const authService = require('../services/authService');
const { sendSuccess, sendCreated, sendNoContent } = require('@devtinder/shared');

class AuthController {
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

module.exports = new AuthController();
