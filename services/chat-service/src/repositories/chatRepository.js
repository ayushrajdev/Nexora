const Chat = require('../models/chat');

class ChatRepository {
  async findByParticipants(userId1, userId2) {
    return await Chat.findOne({
      participants: { $all: [userId1, userId2] }
    });
  }

  async createChat(userId1, userId2) {
    return await Chat.create({
      participants: [userId1, userId2],
      messages: []
    });
  }
  
  async save(chat) {
    return await chat.save();
  }
}

module.exports = new ChatRepository();