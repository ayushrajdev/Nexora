const { Server } = require('socket.io');
const cookie = require('cookie');
const crypto = require('crypto');
const { getSession, COOKIE_NAME } = require('@devtinder/shared');
const chatRepository = require('../repositories/chatRepository');

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONT_END_URL || 'http://localhost:5173',
      credentials: true,
    }
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
        const roomId = crypto.createHash('sha256').update([userId, targetUserId].sort().join('$')).digest('hex');
        socket.join(roomId);
      });

      socket.on('sendMessage', async ({ targetUserId, text }) => {
        const roomId = crypto.createHash('sha256').update([userId, targetUserId].sort().join('$')).digest('hex');
        
        let chat = await chatRepository.findByParticipants(userId, targetUserId);
        if (!chat) {
          chat = await chatRepository.createChat(userId, targetUserId);
        }

        const newMessage = { senderId: userId, text };
        chat.messages.push(newMessage);
        await chatRepository.save(chat);

        io.to(roomId).emit('messageReceived', {
          senderId: userId,
          firstName: firstName,
          text,
          createdAt: new Date()
        });
      });

      socket.on('disconnect', () => {
        // cleanup
      });
    } catch (error) {
      console.error('Socket error:', error);
      socket.disconnect();
    }
  });
};

module.exports = setupSocket;