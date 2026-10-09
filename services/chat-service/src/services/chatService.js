const chatRepository = require('../repositories/chatRepository');
const matchingClient = require('./matchingClient');
const { ForbiddenError } = require('@devtinder/shared');

class ChatService {
  async getChat(userId, targetUserId) {
    const isConnected = await matchingClient.verifyConnection(userId, targetUserId);
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

module.exports = new ChatService();