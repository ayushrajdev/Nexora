import Session from '../models/session.js';

export class SessionRepository {
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

export const sessionRepository = new SessionRepository();
export default sessionRepository;
