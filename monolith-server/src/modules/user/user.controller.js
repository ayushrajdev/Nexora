import userService from './user.service.js';
import { sendSuccess } from '../../core/responseFormatter.js';

export class UserController {
  constructor(service = userService) {
    this.service = service;
  }

  viewProfile = async (req, res, next) => {
    try {
      const user = await this.service.getProfile(req.user._id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  };

  editProfile = async (req, res, next) => {
    try {
      const updatedUser = await this.service.editProfile(
        req.user._id,
        req.body
      );
      sendSuccess(res, updatedUser);
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req, res, next) => {
    try {
      const { oldPassword, newPassword } = req.body;
      await this.service.changePassword(
        req.user._id,
        oldPassword,
        newPassword
      );
      sendSuccess(res, { message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  };

  getInternalProfile = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const profile = await this.service.getSafeProfile(userId);
      sendSuccess(res, profile);
    } catch (err) {
      next(err);
    }
  };

  getFeed = async (req, res, next) => {
    try {
      const { exclude, selfId, page, limit } = req.query;
      const users = await this.service.getFeed(selfId, exclude, page, limit);
      sendSuccess(res, users);
    } catch (err) {
      next(err);
    }
  };
}

export const userController = new UserController();
export default userController;
