import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setRedisClient } from '@devtinder/shared';
import { server } from '../src/app.js';
import chatRepository from '../src/repositories/chatRepository.js';
import matchingClient from '../src/services/matchingClient.js';
import { getRoomId } from '../src/socket/socketHandler.js';

describe('Chat Service — Unit & Route Integration Tests', () => {
  let baseUrl;
  let chatsDb = [];

  before(async () => {
    setRedisClient({
      async get() { return null; },
    });

    chatRepository.findByParticipants = async (u1, u2) =>
      chatsDb.find(
        (c) => c.participants.includes(u1) && c.participants.includes(u2)
      ) ?? null;

    chatRepository.createChat = async (u1, u2) => {
      const chat = {
        _id: `chat_${chatsDb.length + 1}`,
        participants: [u1, u2],
        messages: [],
      };
      chatsDb.push(chat);
      return chat;
    };

    chatRepository.save = async (chat) => chat;

    await new Promise((resolve) => {
      server.listen(0, resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((r) => server.close(r));
  });

  beforeEach(() => {
    chatsDb = [];
  });

  it('Unit: getRoomId produces identical deterministic SHA-256 hash regardless of participant order', () => {
    const r1 = getRoomId('userA', 'userB');
    const r2 = getRoomId('userB', 'userA');
    assert.equal(r1, r2);
    assert.equal(r1.length, 64);
  });

  it('GET /chat/:targetUserId returns 403 Forbidden if users are not connected', async () => {
    matchingClient.verifyConnection = async () => false;

    const res = await fetch(`${baseUrl}/chat/u2`, {
      headers: { 'x-user-id': 'u1' },
    });
    assert.equal(res.status, 403);
  });

  it('GET /chat/:targetUserId initializes or returns chat history when users are connected (200)', async () => {
    matchingClient.verifyConnection = async () => true;

    const res = await fetch(`${baseUrl}/chat/u2`, {
      headers: { 'x-user-id': 'u1' },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.data.participants, ['u1', 'u2']);
    assert.deepEqual(body.data.messages, []);
  });
});
