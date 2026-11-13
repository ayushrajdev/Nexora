import BaseRepository from '../../core/baseRepository.js';
import User from './user.model.js';

export class UserRepository extends BaseRepository {
  constructor(model = User) {
    super(model);
  }

  async findByEmail(emailId) {
    return this.model.findOne({ emailId: emailId.toLowerCase() });
  }

  async findByOauthId(oauthProvider, oauthId) {
    return this.model.findOne({ oauthProvider, oauthId });
  }

  async findFeedUsers(selfId, excludeIds = [], page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return this.model
      .find({
        $and: [{ _id: { $nin: excludeIds } }, { _id: { $ne: selfId } }],
      })
      .select(
        'firstName lastName photoUrl age gender about skills isPremium membershipType'
      )
      .skip(skip)
      .limit(limit);
  }

  async updateMembership(userId, isPremium, membershipType) {
    return this.model.findByIdAndUpdate(
      userId,
      { isPremium, membershipType },
      { new: true }
    );
  }
}

export const userRepository = new UserRepository();
export default userRepository;
