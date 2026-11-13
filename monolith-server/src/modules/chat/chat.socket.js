import { Server } from 'socket.io';
import cookie from 'cookie';
import crypto from 'crypto';
import { getSessionFromStore } from '../../core/sessionStore.js';
import { COOKIE_NAME } from '../../core/constants.js';
import logger from '../../core/logger.js';
import env from '../../config/env.js';
import chatService from './chat.service.js';

export const getRoomId = (userId, targetUserId) =>
  crypto
    .createHash('sha256')
    .update([userId.toString(), targetUserId.toString()].sort().join('$'))
    .digest('hex');

export const setupSocket = (server, service = chatService) => {
  const io = new Server(server, {
    cors: {
      origin: env.FRONT_END_URL,
      credentials: true,
    },
  });

  io.on('connection', async (socket) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const sid = cookies[COOKIE_NAME] || cookies.sid || cookies.token;

      if (!sid) {
        socket.disconnect();
        return;
      }

      const session = await getSessionFromStore(sid);
      if (!session) {
        socket.disconnect();
        return;
      }

      const userId = session.userId;
      socket.userId = userId;
      const firstName = session.firstName || 'User';

      socket.on('joinChat', ({ targetUserId }) => {
        if (!targetUserId) return;
        const roomId = getRoomId(userId, targetUserId);
        socket.join(roomId);
      });

      socket.on('sendMessage', async ({ targetUserId, text }) => {
        if (!targetUserId || !text) return;
        const roomId = getRoomId(userId, targetUserId);

        await service.appendMessage(userId, targetUserId, text);

        io.to(roomId).emit('messageReceived', {
          senderId: userId,
          firstName,
          text,
          createdAt: new Date().toISOString(),
        });
      });

      socket.on('disconnect', () => {
        // cleanup
      });
    } catch (err) {
      logger.error('Socket error in monolith:', { error: err.message });
      socket.disconnect();
    }
  });

  return io;
};

export default setupSocket;
