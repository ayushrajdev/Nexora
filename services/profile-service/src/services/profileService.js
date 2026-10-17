const userRepository = require('../repositories/userRepository');
const { NotFoundError, BadRequestError, ALLOWED_PROFILE_UPDATES } = require('@devtinder/shared');
const bcrypt = require('bcrypt');
const validator = require('validator');

class ProfileService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async getSafeProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    
    const safeFields = ['_id', 'firstName', 'lastName', 'photoUrl', 'age', 'gender', 'about', 'skills'];
    const safeProfile = {};
    safeFields.forEach(field => {
      if (user[field] !== undefined) safeProfile[field] = user[field];
    });
    return safeProfile;
  }

  async editProfile(userId, data) {
    const updates = Object.keys(data);
    const isValidUpdate = updates.every(update => ALLOWED_PROFILE_UPDATES.includes(update));
    if (!isValidUpdate) {
      throw new BadRequestError('Invalid updates');
    }
    
    const updatedUser = await userRepository.updateById(userId, data);
    return updatedUser;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestError('Invalid old password');
    }

    if (!validator.isStrongPassword(newPassword)) {
      throw new BadRequestError('New password is not strong enough');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.updateById(userId, { password: hashedPassword });
    return { success: true };
  }

  async getFeed(selfId, excludeIdsStr, page = 1, limit = 10) {
    let excludeIds = [];
    if (excludeIdsStr) {
      excludeIds = excludeIdsStr.split(',').filter(id => id.trim() !== '');
    }
    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 50) limit = 50;

    const users = await userRepository.findFeedUsers(selfId, excludeIds, page, limit);
    return users;
  }
}

module.exports = new ProfileService();
