import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { EVENTS } from '@devtinder/shared';
import { app } from '../src/app.js';
import razorpayInstance from '../src/config/razorpay.js';
import paymentRepository from '../src/repositories/paymentRepository.js';
import profileClient from '../src/services/profileClient.js';
import { setPaymentPublisher } from '../src/services/paymentService.js';

describe('Payment Service — Unit & Route Integration Tests', () => {
  let server;
  let baseUrl;
  let paymentsDb = new Map();
  let publishedEvents = [];

  before(async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_123';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_test_secret';

    setPaymentPublisher({
      async add(eventName, payload) {
        const job = { id: `job_${publishedEvents.length + 1}`, name: eventName, data: payload };
        publishedEvents.push(job);
        return job;
      },
    });

    razorpayInstance.orders.create = async (opts) => ({
      id: 'order_mock_999',
      amount: opts.amount,
      currency: opts.currency,
      receipt: opts.receipt,
      notes: opts.notes,
    });

    paymentRepository.createPayment = async (data) => {
      paymentsDb.set(data.orderId, { ...data });
      return paymentsDb.get(data.orderId);
    };

    paymentRepository.updatePayment = async (paymentId, orderId, status) => {
      const existing = paymentsDb.get(orderId);
      if (!existing) return null;
      existing.paymentId = paymentId;
      existing.status = status;
      return existing;
    };

    profileClient.getUserProfile = async (userId) => ({
      data: {
        _id: userId,
        isPremium: true,
        membershipType: 'gold',
      },
    });

    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) await new Promise((r) => server.close(r));
  });

  beforeEach(() => {
    paymentsDb.clear();
    publishedEvents = [];
  });

  it('POST /payment/create creates a Razorpay order for silver/gold and rejects invalid membershipType (400)', async () => {
    const badRes = await fetch(`${baseUrl}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'u1',
      },
      body: JSON.stringify({ membershipType: 'platinum' }),
    });
    assert.equal(badRes.status, 400);

    const okRes = await fetch(`${baseUrl}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'u1',
        'x-user-name': 'Elon',
      },
      body: JSON.stringify({ membershipType: 'gold' }),
    });
    assert.equal(okRes.status, 200);
    const body = await okRes.json();
    assert.equal(body.data.order.id, 'order_mock_999');
    assert.equal(body.data.order.amount, 70000);
    assert.equal(body.data.keyId, 'rzp_test_123');
  });

  it('POST /payment/webhook verifies HMAC signature, marks payment captured, and publishes payment.captured to BullMQ', async () => {
    await paymentRepository.createPayment({
      userId: 'u1',
      orderId: 'order_mock_999',
      status: 'created',
      amount: 700,
      currency: 'INR',
      receipt: 'rcpt_1',
      notes: { membershipType: 'gold' },
    });

    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_mock_111',
            order_id: 'order_mock_999',
          },
        },
      },
    };

    const validSignature = crypto
      .createHmac('sha256', 'whsec_test_secret')
      .update(JSON.stringify(webhookPayload))
      .digest('hex');

    // Invalid signature -> 400
    const badSigRes = await fetch(`${baseUrl}/payment/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid_sig',
      },
      body: JSON.stringify(webhookPayload),
    });
    assert.equal(badSigRes.status, 400);

    // Valid signature -> 200 OK + BullMQ event
    const okSigRes = await fetch(`${baseUrl}/payment/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validSignature,
      },
      body: JSON.stringify(webhookPayload),
    });
    assert.equal(okSigRes.status, 200);
    assert.equal(paymentsDb.get('order_mock_999').status, 'captured');
    assert.equal(publishedEvents.length, 1);
    assert.equal(publishedEvents[0].name, EVENTS.PAYMENT_CAPTURED);
    assert.equal(publishedEvents[0].data.membershipType, 'gold');
  });

  it('GET /payment/premium/verify returns user premium status', async () => {
    const res = await fetch(`${baseUrl}/payment/premium/verify`, {
      headers: { 'x-user-id': 'u1' },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.isPremium, true);
    assert.equal(body.data.membershipType, 'gold');
  });
});
