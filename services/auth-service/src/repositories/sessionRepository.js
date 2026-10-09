const Session = require('../models/session');

class SessionRepository {
  async create(sessionData) {
    const session = new Session(sessionData);
    return await session.save();
  }

  async deactivate(sessionId) {
    return await Session.findOneAndUpdate(
      { sessionId },
      { isActive: false },
      { new: true }
    );
  }
}

module.exports = new SessionRepository();
