import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalError,
  internalAuth,
  optionalAuth,
  errorHandler,
  sendSuccess,
  sendCreated,
  sendNoContent,
  setRedisClient,
  createSession,
  getSession,
  destroySession,
  refreshSession,
  updateSession,
  SESSION_PREFIX,
  createPublisher,
  publishEvent,
  closePublishers,
  QUEUES,
  EVENTS,
  MEMBERSHIP_AMOUNT,
  ALLOWED_PROFILE_UPDATES,
  CONNECTION_STATUS,
  COOKIE_NAME,
} from '../src/index.js';

// In-memory Redis mock for unit testing sessionManager
const createMockRedis = () => {
  const store = new Map();
  const ttls = new Map();
  return {
    store,
    ttls,
    async set(key, value, mode, ttl) {
      store.set(key, value);
      if (mode === 'EX') ttls.set(key, ttl);
      return 'OK';
    },
    async get(key) {
      return store.get(key) ?? null;
    },
    async del(key) {
      ttls.delete(key);
      return store.delete(key) ? 1 : 0;
    },
    async expire(key, ttl) {
      if (!store.has(key)) return 0;
      ttls.set(key, ttl);
      return 1;
    },
    async ttl(key) {
      return ttls.get(key) ?? -1;
    },
    async quit() {
      store.clear();
      ttls.clear();
    },
  };
};

describe('@devtinder/shared — Unit Tests', () => {
  describe('Constants', () => {
    it('exports frozen QUEUES, EVENTS, MEMBERSHIP_AMOUNT, and COOKIE_NAME', () => {
      assert.equal(QUEUES.USER_EVENTS, 'user-events');
      assert.equal(QUEUES.CONNECTION_EVENTS, 'connection-events');
      assert.equal(QUEUES.PAYMENT_EVENTS, 'payment-events');
      assert.equal(EVENTS.USER_CREATED, 'user.created');
      assert.equal(EVENTS.CONNECTION_INTERESTED, 'connection.interested');
      assert.equal(EVENTS.CONNECTION_ACCEPTED, 'connection.accepted');
      assert.equal(EVENTS.PAYMENT_CAPTURED, 'payment.captured');
      assert.equal(MEMBERSHIP_AMOUNT.silver, 300);
      assert.equal(MEMBERSHIP_AMOUNT.gold, 700);
      assert.equal(COOKIE_NAME, 'sid');
      assert.ok(ALLOWED_PROFILE_UPDATES.includes('skills'));
      assert.equal(CONNECTION_STATUS.ACCEPTED, 'accepted');
    });
  });

  describe('Custom Errors', () => {
    it('constructs operational and non-operational AppError subclasses accurately', () => {
      const badReq = new BadRequestError('Invalid field');
      assert.ok(badReq instanceof AppError);
      assert.equal(badReq.statusCode, 400);
      assert.equal(badReq.status, 'fail');
      assert.equal(badReq.message, 'Invalid field');

      const unauth = new UnauthorizedError();
      assert.equal(unauth.statusCode, 401);

      const forbidden = new ForbiddenError();
      assert.equal(forbidden.statusCode, 403);

      const notFound = new NotFoundError();
      assert.equal(notFound.statusCode, 404);

      const conflict = new ConflictError();
      assert.equal(conflict.statusCode, 409);

      const internal = new InternalError();
      assert.equal(internal.statusCode, 500);
      assert.equal(internal.status, 'error');
      assert.equal(internal.isOperational, false);
    });
  });

  describe('Response Formatter', () => {
    const createMockRes = () => {
      const res = {
        statusCode: 200,
        body: null,
        sent: false,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.body = payload;
          return this;
        },
        send() {
          this.sent = true;
          return this;
        },
      };
      return res;
    };

    it('formats sendSuccess (200), sendCreated (201), and sendNoContent (204)', () => {
      const res1 = createMockRes();
      sendSuccess(res1, { id: 1 }, 'Fetched');
      assert.equal(res1.statusCode, 200);
      assert.deepEqual(res1.body, {
        success: true,
        message: 'Fetched',
        data: { id: 1 },
      });

      const res2 = createMockRes();
      sendCreated(res2, { id: 2 }, 'Created');
      assert.equal(res2.statusCode, 201);
      assert.equal(res2.body.data.id, 2);

      const res3 = createMockRes();
      sendNoContent(res3);
      assert.equal(res3.statusCode, 204);
      assert.equal(res3.sent, true);
    });
  });

  describe('Auth Middleware (internalAuth & optionalAuth)', () => {
    it('populates req.user when x-user-id header is present', () => {
      const req = {
        headers: {
          'x-user-id': 'u123',
          'x-user-email': 'dev@example.com',
          'x-user-name': 'Ada',
          'x-user-premium': 'true',
          'x-user-membership': 'gold',
        },
      };
      let calledError = null;
      internalAuth(req, {}, (err) => {
        calledError = err;
      });
      assert.equal(calledError, undefined);
      assert.deepEqual(req.user, {
        _id: 'u123',
        emailId: 'dev@example.com',
        firstName: 'Ada',
        isPremium: true,
        membershipType: 'gold',
      });
    });

    it('calls next(UnauthorizedError) when x-user-id header is missing in internalAuth', () => {
      const req = { headers: {} };
      let errPassed = null;
      internalAuth(req, {}, (err) => {
        errPassed = err;
      });
      assert.ok(errPassed instanceof UnauthorizedError);
    });

    it('allows request through without req.user in optionalAuth when header is absent', () => {
      const req = { headers: {} };
      let errPassed = null;
      optionalAuth(req, {}, (err) => {
        errPassed = err;
      });
      assert.equal(errPassed, undefined);
      assert.equal(req.user, undefined);
    });
  });

  describe('Global Error Handler Middleware', () => {
    const createMockRes = () => ({
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    });

    it('handles AppError operational errors with matching status code', () => {
      const res = createMockRes();
      errorHandler(new NotFoundError('Profile missing'), {}, res, () => {});
      assert.equal(res.statusCode, 404);
      assert.equal(res.body.message, 'Profile missing');
    });

    it('handles Mongoose ValidationError as 400', () => {
      const res = createMockRes();
      const validationErr = {
        name: 'ValidationError',
        errors: { firstName: { message: 'First name required' } },
      };
      errorHandler(validationErr, {}, res, () => {});
      assert.equal(res.statusCode, 400);
      assert.deepEqual(res.body.errors, ['First name required']);
    });

    it('handles MongoDB duplicate key (11000) as 409', () => {
      const res = createMockRes();
      const dupErr = { code: 11000, keyValue: { emailId: 'a@b.com' } };
      errorHandler(dupErr, {}, res, () => {});
      assert.equal(res.statusCode, 409);
      assert.match(res.body.message, /emailId/);
    });
  });

  describe('Session Manager (Redis session lifecycle)', () => {
    let mockRedis;

    beforeEach(() => {
      mockRedis = createMockRedis();
      setRedisClient(mockRedis);
    });

    it('creates, retrieves, refreshes, updates, and destroys a Redis session', async () => {
      const { sessionId, sessionData } = await createSession(
        {
          userId: 'user_1',
          email: 'linus@kernel.org',
          firstName: 'Linus',
          isPremium: false,
        },
        3600
      );

      assert.ok(sessionId);
      assert.equal(sessionData.userId, 'user_1');
      assert.equal(mockRedis.ttls.get(`${SESSION_PREFIX}${sessionId}`), 3600);

      const fetched = await getSession(sessionId);
      assert.equal(fetched.email, 'linus@kernel.org');

      await refreshSession(sessionId, 7200);
      assert.equal(mockRedis.ttls.get(`${SESSION_PREFIX}${sessionId}`), 7200);

      const updated = await updateSession(sessionId, {
        isPremium: true,
        membershipType: 'gold',
      });
      assert.equal(updated.isPremium, true);
      assert.equal(updated.membershipType, 'gold');

      await destroySession(sessionId);
      const afterDestroy = await getSession(sessionId);
      assert.equal(afterDestroy, null);
    });
  });

  describe('Message Queue (BullMQ publishEvent)', () => {
    it('publishes an event to a provided Queue publisher instance', async () => {
      const addedJobs = [];
      const fakeQueue = {
        async add(eventName, payload) {
          const job = { id: `job_${addedJobs.length + 1}`, name: eventName, data: payload };
          addedJobs.push(job);
          return job;
        },
      };

      const job = await publishEvent(fakeQueue, EVENTS.USER_CREATED, {
        userId: '123',
        emailId: 'test@dev.io',
      });

      assert.equal(job.id, 'job_1');
      assert.equal(addedJobs.length, 1);
      assert.equal(addedJobs[0].name, EVENTS.USER_CREATED);
      assert.equal(addedJobs[0].data.emailId, 'test@dev.io');
    });
  });
});
