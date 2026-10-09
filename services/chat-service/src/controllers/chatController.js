const chatService = require('../services/chatService');
const { sendSuccess } = require('@devtinder/shared');

class ChatController {
  async getChat(req, res, next) {
    try {
      const userId = req.user._id;
      const targetUserId = req.params.targetUserId;
      const chat = await chatService.getChat(userId, targetUserId);
      sendSuccess(res, chat);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();