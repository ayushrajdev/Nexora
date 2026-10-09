const User = require('../models/user');

class UserRepository {
    async create(userData) {
        const user = new User(userData);
        return await user.save();
    }

    async findByEmail(emailId) {
        return await User.findOne({ emailId });
    }

    async findByOauthId(oauthProvider, oauthId) {
        return await User.findOne({ oauthProvider, oauthId });
    }

    async findById(userId) {
        return await User.findById(userId);
    }

    async updateMembership(userId, isPremium, membershipType) {
        return await User.findByIdAndUpdate(
            userId,
            { isPremium, membershipType },
            { new: true },
        );
    }
}

module.exports = new UserRepository();
