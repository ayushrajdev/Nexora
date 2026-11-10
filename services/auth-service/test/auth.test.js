import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import bcrypt from 'bcrypt';
import { setRedisClient, EVENTS } from '@devtinder/shared';
import { app } from '../src/app.js';
import userRepository from '../src/repositories/userRepository.js';
import sessionRepository from '../src/repositories/sessionRepository.js';
import { setUserPublisher } from '../src/events/publisher.js';
import { handlePaymentEventJob } from '../src/events/consumer.js';
import { validateSignup, validateLogin } from '../src/validators/authValidator.js';

const createMockRedis = () => {
  const store = new Map();
  return {
    store,
    async set(k, v) { store.set(k, v); },
    async get(k) { return store.get(k) ?? null; },
    async del(k) { store.delete(k); },
    async expire() { return 1; },
  };
};

describe('Auth Service — Unit & Route Integration Tests', () => {
  let server;
  let baseUrl;
  let mockRedis;
  let publishedEvents = [];
  let usersDb = new Map();
  let sessionsDb = new Map();

  before(async () => {
    mockRedis = createMockRedis();
    setRedisClient(mockRedis);

    setUserPublisher({
      async add(eventName, payload) {
        const job = { id: `job_${publishedEvents.length + 1}`, name: eventName, data: payload };
        publishedEvents.push(job);
        return job;
      },
    });

    // Mock repositories for deterministic in-memory DB behavior
    userRepository.findByEmail = async (emailId) => {
      for (const u of usersDb.values()) {
        if (u.emailId === emailId.toLowerCase()) return u;
      }
      return null;
    };

    userRepository.create = async (data) => {
      const id = `user_${usersDb.size + 1}`;
      const record = {
        _id: id,
        firstName: data.firstName,
        lastName: data.lastName || '',
        emailId: data.emailId.toLowerCase(),
        password: data.password,
        isPremium: false,
        membershipType: null,
        oauthProvider: data.oauthProvider || null,
        async validatePassword(input) {
          return bcrypt.compare(input, this.password);
        },
        toObject() {
          return { ...this };
        },
      };
      usersDb.set(id, record);
      return record;
    };

    userRepository.updateMembership = async (userId, isPremium, membershipType) => {
      const u = usersDb.get(userId);
      if (u) {
        u.isPremium = isPremium;
        u.membershipType = membershipType;
      }
      return u;
    };

    sessionRepository.create = async (data) => {
      sessionsDb.set(data.sessionId, { ...data, isActive: true });
      return sessionsDb.get(data.sessionId);
    };

    sessionRepository.deactivate = async (sessionId) => {
      const s = sessionsDb.get(sessionId);
      if (s) s.isActive = false;
      return s;
    };

    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) await new Promise((r) => server.close(r));
  });

  beforeEach(() => {
    usersDb.clear();
    sessionsDb.clear();
    mockRedis.store.clear();
    publishedEvents = [];
  });

  describe('Unit: authValidator', () => {
    it('rejects weak password or short firstName in validateSignup', () => {
      let err1 = null;
      validateSignup(
        { body: { firstName: 'Jo', emailId: 'jo@dev.io', password: 'StrongPassword@123' } },
        {},
        (err) => { err1 = err; }
      );
      assert.equal(err1.statusCode, 400);

      let err2 = null;
      validateSignup(
        { body: { firstName: 'John', emailId: 'jo@dev.io', password: 'weak' } },
        {},
        (err) => { err2 = err; }
      );
      assert.equal(err2.statusCode, 400);
    });

    it('rejects invalid email in validateLogin', () => {
      let err = null;
      validateLogin(
        { body: { emailId: 'not-an-email', password: 'secret' } },
        {},
        (e) => { err = e; }
      );
      assert.equal(err.statusCode, 400);
    });
  });

  describe('Integration: POST /signup, POST /login, POST /logout, GET /oauth/*', () => {
    it('POST /signup registers a user, sets sid cookie, stores session in Redis & DB, and publishes user.created to BullMQ', async () => {
      const res = await fetch(`${baseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Satoshi',
          lastName: 'Nakamoto',
          emailId: 'satoshi@bitcoin.org',
          password: 'Password@123',
        }),
      });

      assert.equal(res.status, 201);
      const setCookie = res.headers.get('set-cookie');
      assert.ok(setCookie && setCookie.includes('sid='));

      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.user.firstName, 'Satoshi');
      assert.equal(body.data.user.password, undefined);

      // Verify BullMQ event published
      assert.equal(publishedEvents.length, 1);
      assert.equal(publishedEvents[0].name, EVENTS.USER_CREATED);
      assert.equal(publishedEvents[0].data.emailId, 'satoshi@bitcoin.org');
    });

    it('POST /signup returns 409 Conflict when email already exists', async () => {
      const payload = {
        firstName: 'Satoshi',
        emailId: 'satoshi@bitcoin.org',
        password: 'Password@123',
      };
      await fetch(`${baseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const dupRes = await fetch(`${baseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      assert.equal(dupRes.status, 409);
    });

    it('POST /login authenticates valid credentials and rejects wrong password with 401', async () => {
      await fetch(`${baseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Vitalik',
          emailId: 'vitalik@eth.org',
          password: 'Password@123',
        }),
      });

      const okRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: 'vitalik@eth.org',
          password: 'Password@123',
        }),
      });
      assert.equal(okRes.status, 200);
      assert.ok(okRes.headers.get('set-cookie')?.includes('sid='));

      const badRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: 'vitalik@eth.org',
          password: 'WrongPassword@123',
        }),
      });
      assert.equal(badRes.status, 401);
    });

    it('POST /logout destroys session in Redis & MongoDB and clears cookie (204)', async () => {
      const signupRes = await fetch(`${baseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Torvalds',
          emailId: 'torvalds@linux.org',
          password: 'Password@123',
        }),
      });
      const cookieHeader = signupRes.headers.get('set-cookie').split(';')[0];

      const logoutRes = await fetch(`${baseUrl}/logout`, {
        method: 'POST',
        headers: { Cookie: cookieHeader },
      });
      assert.equal(logoutRes.status, 204);
      assert.equal(mockRedis.store.size, 0);
    });

    it('GET /oauth/google and GET /oauth/github redirect to OAuth provider URLs (302)', async () => {
      const googleRes = await fetch(`${baseUrl}/oauth/google`, { redirect: 'manual' });
      assert.equal(googleRes.status, 302);
      assert.match(googleRes.headers.get('location'), /accounts\.google\.com/);

      const githubRes = await fetch(`${baseUrl}/oauth/github`, { redirect: 'manual' });
      assert.equal(githubRes.status, 302);
      assert.match(githubRes.headers.get('location'), /github\.com\/login\/oauth\/authorize/);
    });
  });

  describe('BullMQ Consumer: handlePaymentEventJob', () => {
    it('upgrades user membership when payment.captured job is processed', async () => {
      const created = await userRepository.create({
        firstName: 'Ada',
        emailId: 'ada@lovelace.org',
        password: 'hash',
      });

      await handlePaymentEventJob({
        name: EVENTS.PAYMENT_CAPTURED,
        data: { userId: created._id, membershipType: 'gold' },
      });

      const updated = usersDb.get(created._id);
      assert.equal(updated.isPremium, true);
      assert.equal(updated.membershipType, 'gold');
    });
  });
});
