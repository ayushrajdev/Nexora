import { Server } from 'socket.io';
import cookie from 'cookie';
import crypto from 'crypto';
import { getSession, COOKIE_NAME, logger } from '@devtinder/shared';
import chatRepository from '../repositories/chatRepository.js';

export const getRoomId = (userId, targetUserId) =>
  crypto
    .createHash('sha256')
    .update([userId.toString(), targetUserId.toString()].sort().join('$'))
    .digest('hex');

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONT_END_URL || 'http://localhost:5173',
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

      const session = await getSession(sid);
      if (!session) {
        socket.disconnect();
        return;
      }

      const userId = session.userId;
      socket.userId = userId;
      const firstName = session.firstName || 'User';

      socket.on('joinChat', ({ targetUserId }) => {
        const roomId = getRoomId(userId, targetUserId);
        socket.join(roomId);
      });

      socket.on('sendMessage', async ({ targetUserId, text }) => {
        const roomId = getRoomId(userId, targetUserId);

        let chat = await chatRepository.findByParticipants(
          userId,
          targetUserId
        );
        if (!chat) {
          chat = await chatRepository.createChat(userId, targetUserId);
        }

        const newMessage = { senderId: userId, text };
        chat.messages.push(newMessage);
        await chatRepository.save(chat);

        io.to(roomId).emit('messageReceived', {
          senderId: userId,
          firstName,
          text,
          createdAt: new Date(),
        });
      });

      socket.on('disconnect', () => {
        // cleanup
      });
    } catch (error) {
      logger.error('Socket error:', { error: error.message });
      socket.disconnect();
    }
  });

  return io;
};

export default setupSocket;
