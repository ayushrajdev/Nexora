import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { EVENTS } from '@devtinder/shared';
import { app } from '../src/app.js';
import templates from '../src/templates/emailTemplates.js';
import { handleUserEventJob } from '../src/consumers/userEventConsumer.js';
import { handleConnectionEventJob } from '../src/consumers/connectionEventConsumer.js';
import { handlePaymentEventJob } from '../src/consumers/paymentEventConsumer.js';

describe('Notification Service — Unit & Route Integration Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) await new Promise((r) => server.close(r));
  });

  it('GET /health returns 200 OK', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.equal(text, 'OK');
  });

  it('Unit: emailTemplates render welcome, interest, match, and payment HTML', () => {
    assert.match(templates.welcomeTemplate('Ayush'), /Welcome to DevTinder, Ayush!/);
    assert.match(templates.interestTemplate('Linus'), /Linus is interested/);
    assert.match(templates.matchTemplate('Ada'), /You and Ada liked each other/);
    assert.match(templates.paymentConfirmationTemplate('gold'), /gold membership/);
  });

  it('BullMQ Consumer: handleUserEventJob sends welcome email on user.created', async () => {
    const sent = [];
    const mockMailer = {
      async sendWelcomeEmail(email, firstName) {
        sent.push({ email, firstName });
      },
    };

    await handleUserEventJob(
      {
        name: EVENTS.USER_CREATED,
        data: { emailId: 'new@dev.io', firstName: 'Grace' },
      },
      mockMailer
    );

    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0], { email: 'new@dev.io', firstName: 'Grace' });
  });

  it('BullMQ Consumer: handleConnectionEventJob sends interest and match emails', async () => {
    const sent = [];
    const mockMailer = {
      async sendInterestEmail(email, fromName) {
        sent.push({ type: 'interest', email, fromName });
      },
      async sendMatchEmail(email1, email2, fromName, toName) {
        sent.push({ type: 'match', email1, email2, fromName, toName });
      },
    };
    const mockProfiles = {
      async getUserEmail(uid) {
        return `${uid}@dev.io`;
      },
    };

    await handleConnectionEventJob(
      {
        name: EVENTS.CONNECTION_INTERESTED,
        data: { toUserId: 'u2', fromUserName: 'Alice' },
      },
      mockMailer,
      mockProfiles
    );

    await handleConnectionEventJob(
      {
        name: EVENTS.CONNECTION_ACCEPTED,
        data: {
          fromUserId: 'u1',
          toUserId: 'u2',
          fromUserName: 'Alice',
          toUserName: 'Bob',
        },
      },
      mockMailer,
      mockProfiles
    );

    assert.equal(sent.length, 2);
    assert.equal(sent[0].type, 'interest');
    assert.equal(sent[0].email, 'u2@dev.io');
    assert.equal(sent[1].type, 'match');
    assert.equal(sent[1].email1, 'u2@dev.io');
    assert.equal(sent[1].email2, 'u1@dev.io');
  });

  it('BullMQ Consumer: handlePaymentEventJob sends payment confirmation email', async () => {
    const sent = [];
    const mockMailer = {
      async sendPaymentConfirmationEmail(email, membershipType) {
        sent.push({ email, membershipType });
      },
    };
    const mockProfiles = {
      async getUserEmail(uid) {
        return `${uid}@dev.io`;
      },
    };

    await handlePaymentEventJob(
      {
        name: EVENTS.PAYMENT_CAPTURED,
        data: { userId: 'u9', membershipType: 'silver' },
      },
      mockMailer,
      mockProfiles
    );

    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0], { email: 'u9@dev.io', membershipType: 'silver' });
  });
});
