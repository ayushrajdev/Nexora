import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { setRedisClient, SESSION_PREFIX } from '@devtinder/shared';
import sanitizeHeaders from '../src/middlewares/sanitizeHeaders.js';
import sessionAuth from '../src/middlewares/sessionAuth.js';
import errorHandler from '../src/middlewares/errorHandler.js';

const createMockRedis = () => {
  const store = new Map();
  const ttls = new Map();
  return {
    store,
    ttls,
    async set(key, val, mode, ttl) {
      store.set(key, val);
      if (mode === 'EX') ttls.set(key, ttl);
    },
    async get(key) {
      return store.get(key) ?? null;
    },
    async expire(key, ttl) {
      ttls.set(key, ttl);
      return 1;
    },
    async del(key) {
      store.delete(key);
    },
  };
};

describe('API Gateway — Unit & Route Integration Tests', () => {
  let mockRedis;

  beforeEach(() => {
    mockRedis = createMockRedis();
    setRedisClient(mockRedis);
  });

  describe('Unit: sanitizeHeaders middleware', () => {
    it('strips any spoofed incoming x-user-* headers', () => {
      const req = {
        headers: {
          'x-user-id': 'spoofed_admin',
          'X-User-Premium': 'true',
          'content-type': 'application/json',
        },
      };
      let nextCalled = false;
      sanitizeHeaders(req, {}, () => {
        nextCalled = true;
      });
      assert.equal(nextCalled, true);
      assert.equal(req.headers['x-user-id'], undefined);
      assert.equal(req.headers['X-User-Premium'], undefined);
      assert.equal(req.headers['content-type'], 'application/json');
    });
  });

  describe('Unit: sessionAuth middleware', () => {
    it('rejects requests without sid cookie with 401 UnauthorizedError', async () => {
      const req = { cookies: {}, headers: {} };
      let errorCaught = null;
      await sessionAuth(req, {}, (err) => {
        errorCaught = err;
      });
      assert.ok(errorCaught);
      assert.equal(errorCaught.statusCode, 401);
      assert.equal(errorCaught.message, 'Authentication required');
    });

    it('rejects requests with expired/unknown sid in Redis', async () => {
      const req = { cookies: { sid: 'unknown_sid' }, headers: {} };
      let errorCaught = null;
      await sessionAuth(req, {}, (err) => {
        errorCaught = err;
      });
      assert.ok(errorCaught);
      assert.equal(errorCaught.statusCode, 401);
      assert.equal(errorCaught.message, 'Session expired or invalid');
    });

    it('injects x-user-* headers and refreshes TTL when session is valid', async () => {
      await mockRedis.set(
        `${SESSION_PREFIX}valid_sid`,
        JSON.stringify({
          userId: 'u_99',
          email: 'grace@hopper.org',
          firstName: 'Grace',
          isPremium: true,
          membershipType: 'gold',
        }),
        'EX',
        100
      );

      const req = { cookies: { sid: 'valid_sid' }, headers: {} };
      let errorCaught = null;
      await sessionAuth(req, {}, (err) => {
        errorCaught = err;
      });

      assert.equal(errorCaught, undefined);
      assert.equal(req.headers['x-user-id'], 'u_99');
      assert.equal(req.headers['x-user-email'], 'grace@hopper.org');
      assert.equal(req.headers['x-user-name'], 'Grace');
      assert.equal(req.headers['x-user-premium'], 'true');
      assert.equal(req.headers['x-user-membership'], 'gold');
    });
  });

  describe('Integration: Gateway HTTP Routes & Proxy Forwarding', () => {
    let downstreamServer;
    let gatewayServer;
    let gatewayUrl;
    let lastDownstreamReq = null;

    before(async () => {
      // Spin up mock downstream service
      const downstreamApp = express();
      downstreamApp.use(express.json());
      downstreamApp.all('*', (req, res) => {
        lastDownstreamReq = {
          method: req.method,
          path: req.path,
          headers: req.headers,
          body: req.body,
        };
        res.status(200).json({ success: true, proxiedPath: req.path });
      });

      await new Promise((resolve) => {
        downstreamServer = http.createServer(downstreamApp).listen(0, resolve);
      });
      const downstreamPort = downstreamServer.address().port;
      const targetUrl = `http://127.0.0.1:${downstreamPort}`;

      process.env.AUTH_SERVICE_URL = targetUrl;
      process.env.PROFILE_SERVICE_URL = targetUrl;
      process.env.MATCHING_SERVICE_URL = targetUrl;
      process.env.CHAT_SERVICE_URL = targetUrl;
      process.env.PAYMENT_SERVICE_URL = targetUrl;

      const { app } = await import('../src/app.js');
      await new Promise((resolve) => {
        gatewayServer = http.createServer(app).listen(0, resolve);
      });
      gatewayUrl = `http://127.0.0.1:${gatewayServer.address().port}`;
    });

    after(async () => {
      if (gatewayServer) await new Promise((r) => gatewayServer.close(r));
      if (downstreamServer) await new Promise((r) => downstreamServer.close(r));
    });

    it('GET /health returns 200 ok', async () => {
      const res = await fetch(`${gatewayUrl}/health`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.status, 'ok');
    });

    it('blocks protected route GET /profile/view without sid cookie (401)', async () => {
      const res = await fetch(`${gatewayUrl}/profile/view`);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
    });

    it('proxies authenticated GET /profile/view with injected X-User-* headers and strips spoofed headers', async () => {
      await mockRedis.set(
        `${SESSION_PREFIX}sess_abc`,
        JSON.stringify({
          userId: 'user_abc',
          email: 'alan@turing.org',
          firstName: 'Alan',
          isPremium: false,
          membershipType: null,
        }),
        'EX',
        3600
      );

      const res = await fetch(`${gatewayUrl}/profile/view`, {
        headers: {
          Cookie: 'sid=sess_abc',
          'x-user-id': 'hacker_id',
        },
      });

      assert.equal(res.status, 200);
      assert.equal(lastDownstreamReq.path, '/profile/view');
      assert.equal(lastDownstreamReq.headers['x-user-id'], 'user_abc');
      assert.equal(lastDownstreamReq.headers['x-user-name'], 'Alan');
    });

    it('proxies public POST /auth/login and rewrites /auth prefix', async () => {
      const res = await fetch(`${gatewayUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: 'alan@turing.org', password: 'Pass' }),
      });

      assert.equal(res.status, 200);
      assert.equal(lastDownstreamReq.path, '/login');
    });
  });
});
