const User = require('../models/user');

class UserRepository {
  async findById(id) {
    return User.findById(id);
  }
  
  async findFeedUsers(selfId, excludeIds, page, limit) {
    const skip = (page - 1) * limit;
    return User.find({
      $and: [
        { _id: { $nin: excludeIds } },
        { _id: { $ne: selfId } }
      ]
    }).select('firstName lastName photoUrl age gender about skills').skip(skip).limit(limit);
  }

  async updateById(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }
}

module.exports = new UserRepository();\n