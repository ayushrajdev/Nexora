import BaseRepository from '../../core/baseRepository.js';
import Session from './session.model.js';

export class SessionRepository extends BaseRepository {
  constructor(model = Session) {
    super(model);
  }

  async findBySessionId(sessionId) {
    return this.model.findOne({ sessionId, isActive: true });
  }

  async deactivate(sessionId) {
    return this.model.findOneAndUpdate(
      { sessionId },
      { isActive: false },
      { new: true }
    );
  }
}

export const sessionRepository = new SessionRepository();
export default sessionRepository;
