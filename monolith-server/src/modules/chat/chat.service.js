import chatRepository from './chat.repository.js';
import matchingService from '../matching/matching.service.js';
import { ErrorFactory } from '../../core/errors.js';

export class ChatService {
  constructor(repo = chatRepository, matching = matchingService) {
    this.repo = repo;
    this.matching = matching;
  }

  async getChat(userId, targetUserId) {
    const { connected } = await this.matching.verifyConnection(
      userId,
      targetUserId
    );
    if (!connected) {
      throw ErrorFactory.forbidden('You are not connected to this user.');
    }

    let chat = await this.repo.findByParticipants(userId, targetUserId);
    if (!chat) {
      chat = await this.repo.createChat(userId, targetUserId);
    }

    return chat;
  }

  async appendMessage(userId, targetUserId, text) {
    let chat = await this.repo.findByParticipants(userId, targetUserId);
    if (!chat) {
      chat = await this.repo.createChat(userId, targetUserId);
    }

    const newMessage = { senderId: userId, text };
    chat.messages.push(newMessage);
    await this.repo.save(chat);
    return newMessage;
  }
}

export const chatService = new ChatService();
export default chatService;
