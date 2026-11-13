import bcrypt from 'bcrypt';
import validator from 'validator';
import userRepository from './user.repository.js';
import {
  ALLOWED_PROFILE_UPDATES,
  DOMAIN_EVENTS,
  USER_SAFE_FIELDS,
} from '../../core/constants.js';
import { ErrorFactory } from '../../core/errors.js';
import domainEventBus from '../../core/eventBus.js';
import logger from '../../core/logger.js';

export class UserService {
  constructor(repo = userRepository, eventBus = domainEventBus) {
    this.repo = repo;
    this.eventBus = eventBus;
  }

  async getProfile(userId) {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw ErrorFactory.notFound('User not found');
    }
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;
    return userObj;
  }

  async getSafeProfile(userId) {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw ErrorFactory.notFound('User not found');
    }
    const safeProfile = {};
    USER_SAFE_FIELDS.forEach((field) => {
      if (user[field] !== undefined) {
        safeProfile[field] = user[field];
      }
    });
    return safeProfile;
  }

  async getUserEmail(userId) {
    const user = await this.repo.findById(userId);
    return user ? user.emailId : null;
  }

  async editProfile(userId, data) {
    const updates = Object.keys(data);
    const isValidUpdate = updates.every((update) =>
      ALLOWED_PROFILE_UPDATES.includes(update)
    );
    if (!isValidUpdate) {
      throw ErrorFactory.badRequest('Invalid updates');
    }

    const updatedUser = await this.repo.updateById(userId, data);
    if (!updatedUser) {
      throw ErrorFactory.notFound('User not found');
    }
    const userObj = updatedUser.toObject
      ? updatedUser.toObject()
      : { ...updatedUser };
    delete userObj.password;
    return userObj;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw ErrorFactory.notFound('User not found');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw ErrorFactory.badRequest('Invalid old password');
    }

    if (!validator.isStrongPassword(newPassword)) {
      throw ErrorFactory.badRequest('New password is not strong enough');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.repo.updateById(userId, { password: hashedPassword });
    return { success: true };
  }

  async getFeed(selfId, excludeIdsInput, page = 1, limit = 10) {
    let excludeIds = [];
    if (Array.isArray(excludeIdsInput)) {
      excludeIds = excludeIdsInput;
    } else if (typeof excludeIdsInput === 'string' && excludeIdsInput.trim()) {
      excludeIds = excludeIdsInput
        .split(',')
        .filter((id) => id.trim() !== '');
    }

    const pageNum = parseInt(page, 10) || 1;
    let limitNum = parseInt(limit, 10) || 10;
    if (limitNum > 50) limitNum = 50;

    return this.repo.findFeedUsers(selfId, excludeIds, pageNum, limitNum);
  }

  async upgradeMembership(userId, membershipType) {
    const updated = await this.repo.updateMembership(
      userId,
      true,
      membershipType
    );
    logger.info(
      `Upgraded membership for user ${userId} to ${membershipType}`
    );
    return updated;
  }

  registerDomainEvents() {
    this.eventBus.subscribe(
      DOMAIN_EVENTS.PAYMENT_CAPTURED,
      async ({ userId, membershipType }) => {
        await this.upgradeMembership(userId, membershipType);
      }
    );
  }
}

export const userService = new UserService();
export default userService;
