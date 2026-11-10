import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import bcrypt from 'bcrypt';
import { app } from '../src/app.js';
import userRepository from '../src/repositories/userRepository.js';

describe('Profile Service — Unit & Route Integration Tests', () => {
  let server;
  let baseUrl;
  let usersDb = new Map();

  before(async () => {
    userRepository.findById = async (id) => usersDb.get(id) ?? null;

    userRepository.updateById = async (id, updates) => {
      const existing = usersDb.get(id);
      if (!existing) return null;
      const updated = {
        ...existing,
        ...updates,
        toObject() {
          return { ...this };
        },
      };
      usersDb.set(id, updated);
      return updated;
    };

    userRepository.findFeedUsers = async (selfId, excludeIds, page, limit) => {
      const results = [];
      for (const u of usersDb.values()) {
        if (u._id !== selfId && !excludeIds.includes(u._id)) {
          results.push({
            _id: u._id,
            firstName: u.firstName,
            lastName: u.lastName,
            skills: u.skills,
          });
        }
      }
      const start = (page - 1) * limit;
      return results.slice(start, start + limit);
    };

    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) await new Promise((r) => server.close(r));
  });

  beforeEach(async () => {
    usersDb.clear();
    const hashedPassword = await bcrypt.hash('OldPassword@123', 10);
    usersDb.set('u1', {
      _id: 'u1',
      firstName: 'Brendan',
      lastName: 'Eich',
      emailId: 'brendan@js.org',
      password: hashedPassword,
      age: 40,
      gender: 'male',
      about: 'Created JS in 10 days',
      skills: ['JavaScript'],
      toObject() {
        return { ...this };
      },
    });
    usersDb.set('u2', {
      _id: 'u2',
      firstName: 'Ryan',
      lastName: 'Dahl',
      emailId: 'ryan@nodejs.org',
      skills: ['Node.js', 'Rust'],
      toObject() {
        return { ...this };
      },
    });
  });

  it('GET /profile/view returns 401 without x-user-id and 200 with user profile (omitting password)', async () => {
    const unauthRes = await fetch(`${baseUrl}/profile/view`);
    assert.equal(unauthRes.status, 401);

    const authRes = await fetch(`${baseUrl}/profile/view`, {
      headers: { 'x-user-id': 'u1' },
    });
    assert.equal(authRes.status, 200);
    const body = await authRes.json();
    assert.equal(body.data.firstName, 'Brendan');
    assert.equal(body.data.password, undefined);
  });

  it('PATCH /profile/edit updates allowed fields and rejects disallowed fields (emailId/isPremium) with 400', async () => {
    const okRes = await fetch(`${baseUrl}/profile/edit`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'u1',
      },
      body: JSON.stringify({
        about: 'Co-founder of Brave',
        skills: ['JavaScript', 'C++'],
      }),
    });
    assert.equal(okRes.status, 200);
    const okBody = await okRes.json();
    assert.equal(okBody.data.about, 'Co-founder of Brave');
    assert.deepEqual(okBody.data.skills, ['JavaScript', 'C++']);

    const badRes = await fetch(`${baseUrl}/profile/edit`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'u1',
      },
      body: JSON.stringify({
        isPremium: true,
      }),
    });
    assert.equal(badRes.status, 400);
  });

  it('PATCH /profile/password updates password when oldPassword matches and newPassword is strong', async () => {
    const wrongOldRes = await fetch(`${baseUrl}/profile/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'u1',
      },
      body: JSON.stringify({
        oldPassword: 'WrongOldPassword@123',
        newPassword: 'NewStrongPassword@456',
      }),
    });
    assert.equal(wrongOldRes.status, 400);

    const okRes = await fetch(`${baseUrl}/profile/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'u1',
      },
      body: JSON.stringify({
        oldPassword: 'OldPassword@123',
        newPassword: 'NewStrongPassword@456',
      }),
    });
    assert.equal(okRes.status, 200);
    const isUpdated = await bcrypt.compare(
      'NewStrongPassword@456',
      usersDb.get('u1').password
    );
    assert.equal(isUpdated, true);
  });

  it('GET /profile/:userId and GET /profile/feed work for internal service calls', async () => {
    const safeRes = await fetch(`${baseUrl}/profile/u2`, {
      headers: { 'x-internal-service': 'secret' },
    });
    assert.equal(safeRes.status, 200);
    const safeBody = await safeRes.json();
    assert.equal(safeBody.data.firstName, 'Ryan');
    assert.equal(safeBody.data.emailId, undefined);

    const feedRes = await fetch(`${baseUrl}/profile/feed?selfId=u1&exclude=&page=1&limit=10`, {
      headers: { 'x-internal-service': 'secret' },
    });
    assert.equal(feedRes.status, 200);
    const feedBody = await feedRes.json();
    assert.equal(feedBody.data.length, 1);
    assert.equal(feedBody.data[0].firstName, 'Ryan');
  });
});
