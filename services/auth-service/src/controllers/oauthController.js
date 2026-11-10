import oauthService from '../services/oauthService.js';

export class OauthController {
  async googleRedirect(req, res, next) {
    try {
      const url = oauthService.getGoogleAuthUrl();
      res.redirect(url);
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req, res, next) {
    try {
      const { code } = req.query;
      await oauthService.handleGoogleCallback(code, req, res);
      res.redirect(process.env.FRONT_END_URL || 'http://localhost:3000');
    } catch (error) {
      next(error);
    }
  }

  async githubRedirect(req, res, next) {
    try {
      const url = oauthService.getGithubAuthUrl();
      res.redirect(url);
    } catch (error) {
      next(error);
    }
  }

  async githubCallback(req, res, next) {
    try {
      const { code } = req.query;
      await oauthService.handleGithubCallback(code, req, res);
      res.redirect(process.env.FRONT_END_URL || 'http://localhost:3000');
    } catch (error) {
      next(error);
    }
  }
}

export const oauthController = new OauthController();
export default oauthController;
