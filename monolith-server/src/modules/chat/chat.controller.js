import chatService from './chat.service.js';
import { sendSuccess } from '../../core/responseFormatter.js';

export class ChatController {
  constructor(service = chatService) {
    this.service = service;
  }

  getChat = async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { targetUserId } = req.params;
      const chat = await this.service.getChat(userId, targetUserId);
      sendSuccess(res, chat);
    } catch (err) {
      next(err);
    }
  };
}

export const chatController = new ChatController();
export default chatController;
