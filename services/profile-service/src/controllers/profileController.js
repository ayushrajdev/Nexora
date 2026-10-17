const profileService = require('../services/profileService');
const { sendSuccess } = require('@devtinder/shared');

class ProfileController {
  async viewProfile(req, res, next) {
    try {
      const user = await profileService.getProfile(req.user._id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  async editProfile(req, res, next) {
    try {
      const updatedUser = await profileService.editProfile(req.user._id, req.body);
      sendSuccess(res, updatedUser);
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      await profileService.changePassword(req.user._id, oldPassword, newPassword);
      sendSuccess(res, { message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getInternalProfile(req, res, next) {
    try {
      const { userId } = req.params;
      const profile = await profileService.getSafeProfile(userId);
      sendSuccess(res, profile);
    } catch (err) {
      next(err);
    }
  }

  async getFeed(req, res, next) {
    try {
      const { exclude, selfId, page, limit } = req.query;
      const users = await profileService.getFeed(selfId, exclude, page, limit);
      sendSuccess(res, users);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProfileController();
