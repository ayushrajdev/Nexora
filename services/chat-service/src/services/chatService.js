import chatRepository from '../repositories/chatRepository.js';
import matchingClient from './matchingClient.js';
import { ForbiddenError } from '@devtinder/shared';

export class ChatService {
  async getChat(userId, targetUserId) {
    const isConnected = await matchingClient.verifyConnection(
      userId,
      targetUserId
    );
    if (!isConnected) {
      throw new ForbiddenError('You are not connected to this user.');
    }

    let chat = await chatRepository.findByParticipants(userId, targetUserId);
    if (!chat) {
      chat = await chatRepository.createChat(userId, targetUserId);
    }

    return chat;
  }
}

export const chatService = new ChatService();
export default chatService;
