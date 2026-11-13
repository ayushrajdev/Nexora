import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

import { app, initializeDomainEventSubscribers } from '../src/app.js';
import {
  InMemorySessionStoreStrategy,
  SessionStoreFactory,
  setSessionStore,
} from '../src/core/sessionStore.js';
import { ErrorFactory } from '../src/core/errors.js';
import { ResponseFactory } from '../src/core/responseFormatter.js';
import { DOMAIN_EVENTS } from '../src/core/constants.js';
import domainEventBus from '../src/core/eventBus.js';

import { userRepository } from '../src/modules/user/index.js';
import {
  sessionRepository,
  OAuthStrategyFactory,
} from '../src/modules/auth/index.js';
import {
  connectionRequestRepository,
  MatchingStrategyFactory,
} from '../src/modules/matching/index.js';
import { chatRepository, getRoomId, setupSocket } from '../src/modules/chat/index.js';
import {
  paymentRepository,
  MembershipPlanStrategyFactory,
  razorpayInstance,
} from '../src/modules/payment/index.js';
import {
  notificationService,
  NotificationStrategyFactory,
  templates,
} from '../src/modules/notification/index.js';

describe('DevTinder Modular Monolith Server — Unit & Integration Tests', () => {
  let server;
  let io;
  let baseUrl;
  let memorySessionStore;

  const usersDb = new Map();
  const sessionsDb = new Map();
  const requestsDb = new Map();
  const chatsDb = new Map();
  const paymentsDb = new Map();
  const sentEmails = [];

  before(async () => {
    memorySessionStore = new InMemorySessionStoreStrategy();
    setSessionStore(memorySessionStore);

    // Mock notification strategy to capture sent emails
    notificationService.strategy = {
      async send(toAddress, subject, bodyHtml) {
        const record = { toAddress, subject, bodyHtml };
        sentEmails.push(record);
        return record;
      },
    };
    initializeDomainEventSubscribers();

    // 1. In-memory UserRepository mocks
    userRepository.findByEmail = async (emailId) => {
      for (const u of usersDb.values()) {
        if (u.emailId === emailId.toLowerCase()) return u;
      }
      return null;
    };

    userRepository.findById = async (id) => {
      return usersDb.get(id?.toString()) || null;
    };

    userRepository.findByOauthId = async (provider, oauthId) => {
      for (const u of usersDb.values()) {
        if (u.oauthProvider === provider && u.oauthId === oauthId) return u;
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
        age: data.age || 25,
        gender: data.gender || 'other',
        photoUrl:
          data.photoUrl ||
          'https://geographyandyou.com/images/user-profile.png',
        about: data.about || 'Builder bio',
        skills: data.skills || ['TypeScript', 'React'],
        isPremium: false,
        membershipType: null,
        oauthProvider: data.oauthProvider || null,
        oauthId: data.oauthId || null,
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

    userRepository.updateById = async (id, updates) => {
      const u = usersDb.get(id?.toString());
      if (!u) return null;
      Object.assign(u, updates);
      return u;
    };

    userRepository.updateMembership = async (
      userId,
      isPremium,
      membershipType
    ) => {
      const u = usersDb.get(userId?.toString());
      if (!u) return null;
      u.isPremium = isPremium;
      u.membershipType = membershipType;
      return u;
    };

    userRepository.findFeedUsers = async (selfId, excludeIds = []) => {
      const excluded = new Set([selfId?.toString(), ...excludeIds]);
      const result = [];
      for (const u of usersDb.values()) {
        if (!excluded.has(u._id.toString())) {
          const copy = { ...u };
          delete copy.password;
          result.push(copy);
        }
      }
      return result;
    };

    // 2. In-memory SessionRepository mocks
    sessionRepository.create = async (data) => {
      sessionsDb.set(data.sessionId, { ...data, isActive: true });
      return sessionsDb.get(data.sessionId);
    };

    sessionRepository.deactivate = async (sessionId) => {
      const s = sessionsDb.get(sessionId);
      if (s) s.isActive = false;
      return s;
    };

    // 3. In-memory ConnectionRequestRepository mocks
    connectionRequestRepository.findExistingRequest = async (u1, u2) => {
      for (const r of requestsDb.values()) {
        if (
          (r.fromUserId === u1 && r.toUserId === u2) ||
          (r.fromUserId === u2 && r.toUserId === u1)
        ) {
          return r;
        }
      }
      return null;
    };

    connectionRequestRepository.create = async (data) => {
      const id = `req_${requestsDb.size + 1}`;
      const record = {
        _id: id,
        fromUserId: data.fromUserId.toString(),
        toUserId: data.toUserId.toString(),
        status: data.status,
        async save() {
          requestsDb.set(this._id, this);
          return this;
        },
        toObject() {
          return {
            _id: this._id,
            fromUserId: this.fromUserId,
            toUserId: this.toUserId,
            status: this.status,
          };
        },
      };
      requestsDb.set(id, record);
      return record;
    };

    connectionRequestRepository.findByIdAndToUserIdAndStatus = async (
      id,
      toUserId,
      status
    ) => {
      const r = requestsDb.get(id);
      if (
        r &&
        r.toUserId === toUserId.toString() &&
        r.status === status
      ) {
        return r;
      }
      return null;
    };

    connectionRequestRepository.findReceivedRequests = async (
      toUserId,
      status
    ) => {
      const res = [];
      for (const r of requestsDb.values()) {
        if (r.toUserId === toUserId.toString() && r.status === status) {
          res.push(r);
        }
      }
      return res;
    };

    connectionRequestRepository.findConnections = async (userId) => {
      const uid = userId.toString();
      const res = [];
      for (const r of requestsDb.values()) {
        if (
          r.status === 'accepted' &&
          (r.fromUserId === uid || r.toUserId === uid)
        ) {
          res.push(r);
        }
      }
      return res;
    };

    connectionRequestRepository.findConnectionBetween = async (u1, u2) => {
      for (const r of requestsDb.values()) {
        if (
          r.status === 'accepted' &&
          ((r.fromUserId === u1.toString() && r.toUserId === u2.toString()) ||
            (r.fromUserId === u2.toString() && r.toUserId === u1.toString()))
        ) {
          return r;
        }
      }
      return null;
    };

    connectionRequestRepository.findAllRequestsForUser = async (userId) => {
      const uid = userId.toString();
      const res = [];
      for (const r of requestsDb.values()) {
        if (r.fromUserId === uid || r.toUserId === uid) {
          res.push(r);
        }
      }
      return res;
    };

    // 4. In-memory ChatRepository mocks
    chatRepository.findByParticipants = async (u1, u2) => {
      const key = [u1.toString(), u2.toString()].sort().join(':');
      return chatsDb.get(key) || null;
    };

    chatRepository.createChat = async (u1, u2) => {
      const key = [u1.toString(), u2.toString()].sort().join(':');
      const chat = {
        _id: `chat_${chatsDb.size + 1}`,
        participants: [u1.toString(), u2.toString()],
        messages: [],
        async save() {
          chatsDb.set(key, this);
          return this;
        },
      };
      chatsDb.set(key, chat);
      return chat;
    };

    chatRepository.save = async (chat) => chat.save();

    // 5. In-memory PaymentRepository & Razorpay mocks
    razorpayInstance.orders.create = async (options) => ({
      id: `order_${paymentsDb.size + 1}`,
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt,
      status: 'created',
      notes: options.notes,
    });

    paymentRepository.createPayment = async (data) => {
      const record = { _id: `pay_${paymentsDb.size + 1}`, ...data };
      paymentsDb.set(data.orderId, record);
      return record;
    };

    paymentRepository.updatePayment = async (paymentId, orderId, status) => {
      const p = paymentsDb.get(orderId);
      if (!p) return null;
      p.paymentId = paymentId;
      p.status = status;
      return p;
    };

    await new Promise((resolve) => {
      server = http.createServer(app);
      io = setupSocket(server);
      server.listen(0, resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (io) io.close();
    if (server) await new Promise((r) => server.close(r));
  });

  beforeEach(() => {
    usersDb.clear();
    sessionsDb.clear();
    requestsDb.clear();
    chatsDb.clear();
    paymentsDb.clear();
    sentEmails.length = 0;
    memorySessionStore.clear();
  });

  describe('Unit: Design Patterns (Factory, Strategy, Observer)', () => {
    it('ErrorFactory creates typed operational AppError instances', () => {
      const badReq = ErrorFactory.badRequest('Invalid input');
      assert.equal(badReq.statusCode, 400);
      const unauth = ErrorFactory.unauthorized();
      assert.equal(unauth.statusCode, 401);
      const forbidden = ErrorFactory.forbidden();
      assert.equal(forbidden.statusCode, 403);
      const notFound = ErrorFactory.notFound();
      assert.equal(notFound.statusCode, 404);
      const conflict = ErrorFactory.conflict('Exists');
      assert.equal(conflict.statusCode, 409);
      const internal = ErrorFactory.internal();
      assert.equal(internal.statusCode, 500);
    });

    it('SessionStoreFactory & OAuthStrategyFactory & MatchingStrategyFactory & MembershipPlanStrategyFactory resolve strategies', () => {
      const memStore = SessionStoreFactory.create('memory');
      assert.ok(memStore instanceof InMemorySessionStoreStrategy);

      const googleStrategy = OAuthStrategyFactory.getStrategy('google');
      assert.match(
        googleStrategy.getAuthUrl(),
        /accounts\.google\.com\/o\/oauth2/
      );

      const githubStrategy = OAuthStrategyFactory.getStrategy('github');
      assert.match(
        githubStrategy.getAuthUrl(),
        /github\.com\/login\/oauth\/authorize/
      );

      const swipeStrategy = MatchingStrategyFactory.getSwipeStrategy('interested');
      assert.ok(swipeStrategy);
      assert.throws(() => MatchingStrategyFactory.getSwipeStrategy('invalid'));

      const goldStrategy = MembershipPlanStrategyFactory.getStrategy('gold');
      assert.equal(goldStrategy.amountInr, 700);
      assert.equal(goldStrategy.buildOrderOptions().amount, 70000);

      const silverStrategy = MembershipPlanStrategyFactory.getStrategy('silver');
      assert.equal(silverStrategy.amountInr, 300);
      assert.equal(silverStrategy.buildOrderOptions().amount, 30000);

      const notifStrategy = NotificationStrategyFactory.create('console');
      assert.ok(notifStrategy);
      assert.match(templates.welcomeTemplate('Ada'), /Ada/);
    });

    it('getRoomId produces deterministic SHA-256 hash regardless of participant order', () => {
      assert.equal(getRoomId('user_1', 'user_2'), getRoomId('user_2', 'user_1'));
    });
  });

  describe('Integration: Security, Validation & Error Boundaries', () => {
    it('blocks unauthenticated access to protected routes (/profile/view, /user/feed, /chat/:id, /payment/create) with 401', async () => {
      const pRes = await fetch(`${baseUrl}/profile/view`);
      assert.equal(pRes.status, 401);

      const fRes = await fetch(`${baseUrl}/user/feed`);
      assert.equal(fRes.status, 401);

      const cRes = await fetch(`${baseUrl}/chat/user_2`);
      assert.equal(cRes.status, 401);

      const payRes = await fetch(`${baseUrl}/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipType: 'gold' }),
      });
      assert.equal(payRes.status, 401);
    });

    it('rejects weak passwords, duplicate emails (409), disallowed profile fields (400), and non-connected chat access (403)', async () => {
      // Weak password
      const badSignup = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Ada',
          emailId: 'ada@devtinder.io',
          password: 'weak',
        }),
      });
      assert.equal(badSignup.status, 400);

      // Valid signup
      const okSignup = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Ada',
          emailId: 'ada@devtinder.io',
          password: 'Password@123',
        }),
      });
      assert.equal(okSignup.status, 201);
      const cookie = okSignup.headers.get('set-cookie').split(';')[0];

      // Duplicate email
      const dupSignup = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Ada',
          emailId: 'ada@devtinder.io',
          password: 'Password@123',
        }),
      });
      assert.equal(dupSignup.status, 409);

      // Disallowed profile field update (isPremium)
      const badEdit = await fetch(`${baseUrl}/profile/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({ isPremium: true }),
      });
      assert.equal(badEdit.status, 400);

      // Non-connected chat access
      const chatRes = await fetch(`${baseUrl}/chat/unconnected_user_99`, {
        headers: { Cookie: cookie },
      });
      assert.equal(chatRes.status, 403);
    });

    it('GET /auth/oauth/google and /auth/oauth/github redirect to OAuth providers (302)', async () => {
      const gRes = await fetch(`${baseUrl}/auth/oauth/google`, {
        redirect: 'manual',
      });
      assert.equal(gRes.status, 302);
      assert.match(gRes.headers.get('location'), /accounts\.google\.com/);

      const ghRes = await fetch(`${baseUrl}/auth/oauth/github`, {
        redirect: 'manual',
      });
      assert.equal(ghRes.status, 302);
      assert.match(
        ghRes.headers.get('location'),
        /github\.com\/login\/oauth\/authorize/
      );
    });
  });

  describe('Integration: End-to-End Modular Monolith Lifecycle', () => {
    it('GET /health returns 200 modular-monolith status', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.status, 'ok');
      assert.equal(body.architecture, 'modular-monolith');
    });

    it('full flow: Auth signup/login -> Profile view/edit/password -> Matching swipe & accept -> Chat history -> Payment order & webhook upgrade', async () => {
      // 1. Signup User 1 (Ada)
      const signup1 = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Ada',
          lastName: 'Lovelace',
          emailId: 'ada@devtinder.io',
          password: 'Password@123',
        }),
      });
      assert.equal(signup1.status, 201);
      const cookie1 = signup1.headers.get('set-cookie').split(';')[0];
      const body1 = await signup1.json();
      const adaId = body1.data.user._id;

      // Welcome email triggered via DomainEventBus
      assert.equal(sentEmails.length, 1);
      assert.equal(sentEmails[0].toAddress, 'ada@devtinder.io');

      // 2. Signup User 2 (Alan)
      const signup2 = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Alan',
          lastName: 'Turing',
          emailId: 'alan@devtinder.io',
          password: 'Password@123',
        }),
      });
      assert.equal(signup2.status, 201);
      const cookie2 = signup2.headers.get('set-cookie').split(';')[0];
      const body2 = await signup2.json();
      const alanId = body2.data.user._id;

      // 3. View & Edit Ada's Profile + Change Password
      const editRes = await fetch(`${baseUrl}/profile/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie1,
        },
        body: JSON.stringify({
          about: 'Analytical Engine Architect',
          skills: ['TypeScript', 'Rust', 'Math'],
        }),
      });
      assert.equal(editRes.status, 200);
      const editBody = await editRes.json();
      assert.equal(editBody.data.about, 'Analytical Engine Architect');

      const pwdRes = await fetch(`${baseUrl}/profile/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie1,
        },
        body: JSON.stringify({
          oldPassword: 'Password@123',
          newPassword: 'NewStrongPassword@123',
        }),
      });
      assert.equal(pwdRes.status, 200);

      // 4. Ada checks Discovery Feed (should see Alan)
      const feedRes = await fetch(`${baseUrl}/user/feed`, {
        headers: { Cookie: cookie1 },
      });
      assert.equal(feedRes.status, 200);
      const feedBody = await feedRes.json();
      assert.equal(feedBody.data.length, 1);
      assert.equal(feedBody.data[0].firstName, 'Alan');

      // 5. Ada swipes 'interested' on Alan
      const swipeRes = await fetch(
        `${baseUrl}/request/send/interested/${alanId}`,
        {
          method: 'POST',
          headers: { Cookie: cookie1 },
        }
      );
      assert.equal(swipeRes.status, 200);
      const swipeBody = await swipeRes.json();
      const requestId = swipeBody.data._id;

      // Alan checks received requests
      const recRes = await fetch(`${baseUrl}/user/requests/received`, {
        headers: { Cookie: cookie2 },
      });
      assert.equal(recRes.status, 200);
      const recBody = await recRes.json();
      assert.equal(recBody.data.length, 1);
      assert.equal(recBody.data[0].fromUser.firstName, 'Ada');

      // 6. Alan accepts Ada's connection request
      const acceptRes = await fetch(
        `${baseUrl}/request/review/accepted/${requestId}`,
        {
          method: 'POST',
          headers: { Cookie: cookie2 },
        }
      );
      assert.equal(acceptRes.status, 200);

      // Verify mutual connection list
      const connRes = await fetch(`${baseUrl}/user/connections`, {
        headers: { Cookie: cookie1 },
      });
      assert.equal(connRes.status, 200);
      const connBody = await connRes.json();
      assert.equal(connBody.data.length, 1);
      assert.equal(connBody.data[0].user.firstName, 'Alan');

      // 7. Chat Module — Ada fetches chat session with Alan
      const chatRes = await fetch(`${baseUrl}/chat/${alanId}`, {
        headers: { Cookie: cookie1 },
      });
      assert.equal(chatRes.status, 200);
      const chatBody = await chatRes.json();
      assert.ok(Array.isArray(chatBody.data.messages));

      // 8. Payment Module — Ada creates Gold order & webhook upgrades membership
      const orderRes = await fetch(`${baseUrl}/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie1,
        },
        body: JSON.stringify({ membershipType: 'gold' }),
      });
      assert.equal(orderRes.status, 200);
      const orderBody = await orderRes.json();
      const orderId = orderBody.data.order.id;

      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_rzp_999',
              order_id: orderId,
            },
          },
        },
      };
      const secret =
        process.env.RAZORPAY_WEBHOOK_SECRET || 'your-razorpay-webhook-secret';
      const sig = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(webhookPayload))
        .digest('hex');

      const webhookRes = await fetch(`${baseUrl}/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': sig,
        },
        body: JSON.stringify(webhookPayload),
      });
      assert.equal(webhookRes.status, 200);

      // Verify Ada's premium status via GET /payment/premium/verify
      const verifyRes = await fetch(`${baseUrl}/payment/premium/verify`, {
        headers: { Cookie: cookie1 },
      });
      assert.equal(verifyRes.status, 200);
      const verifyBody = await verifyRes.json();
      assert.equal(verifyBody.data.isPremium, true);
      assert.equal(verifyBody.data.membershipType, 'gold');

      // 9. Logout
      const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { Cookie: cookie1 },
      });
      assert.equal(logoutRes.status, 204);
    });
  });
});
