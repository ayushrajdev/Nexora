import BaseRepository from '../../core/baseRepository.js';
import Chat from './chat.model.js';

export class ChatRepository extends BaseRepository {
  constructor(model = Chat) {
    super(model);
  }

  async findByParticipants(userId1, userId2) {
    return this.model.findOne({
      participants: { $all: [userId1, userId2] },
    });
  }

  async createChat(userId1, userId2) {
    return this.model.create({
      participants: [userId1, userId2],
      messages: [],
    });
  }

  async save(chat) {
    return chat.save();
  }
}

export const chatRepository = new ChatRepository();
export default chatRepository;
