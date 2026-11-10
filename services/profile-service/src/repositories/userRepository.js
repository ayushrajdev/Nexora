import User from '../models/user.js';

export class UserRepository {
  async findById(id) {
    return User.findById(id);
  }

  async findFeedUsers(selfId, excludeIds, page, limit) {
    const skip = (page - 1) * limit;
    return User.find({
      $and: [
        { _id: { $nin: excludeIds } },
        { _id: { $ne: selfId } },
      ],
    })
      .select('firstName lastName photoUrl age gender about skills')
      .skip(skip)
      .limit(limit);
  }

  async updateById(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }
}

export const userRepository = new UserRepository();
export default userRepository;
