import chatService from '../services/chatService.js';
import { sendSuccess } from '@devtinder/shared';

export class ChatController {
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

export const chatController = new ChatController();
export default chatController;
