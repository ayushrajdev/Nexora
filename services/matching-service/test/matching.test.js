import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { EVENTS } from '@devtinder/shared';
import { app } from '../src/app.js';
import requestRepo from '../src/repositories/connectionRequestRepository.js';
import profileClient from '../src/services/profileClient.js';
import { setConnectionPublisher } from '../src/events/publisher.js';

describe('Matching Service — Unit & Route Integration Tests', () => {
  let server;
  let baseUrl;
  let requestsDb = [];
  let publishedEvents = [];
  const profilesMap = new Map([
    ['u1', { _id: 'u1', firstName: 'Alice', lastName: 'Dev' }],
    ['u2', { _id: 'u2', firstName: 'Bob', lastName: 'Coder' }],
    ['u3', { _id: 'u3', firstName: 'Charlie', lastName: 'Hacker' }],
  ]);

  before(async () => {
    setConnectionPublisher({
      async add(eventName, payload) {
        const job = { id: `job_${publishedEvents.length + 1}`, name: eventName, data: payload };
        publishedEvents.push(job);
        return job;
      },
    });

    profileClient.getProfile = async (userId) => profilesMap.get(userId.toString()) ?? null;
    profileClient.getFeed = async (selfId, excludeIds) => {
      const list = [];
      for (const [id, prof] of profilesMap.entries()) {
        if (id !== selfId && !excludeIds.includes(id)) list.push(prof);
      }
      return list;
    };

    requestRepo.findExistingRequest = async (u1, u2) =>
      requestsDb.find(
        (r) =>
          (r.fromUserId === u1 && r.toUserId === u2) ||
          (r.fromUserId === u2 && r.toUserId === u1)
      ) ?? null;

    requestRepo.create = async (data) => {
      const doc = {
        _id: `req_${requestsDb.length + 1}`,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        status: data.status,
        async save() { return this; },
        toObject() { return { _id: this._id, fromUserId: this.fromUserId, toUserId: this.toUserId, status: this.status }; },
      };
      requestsDb.push(doc);
      return doc;
    };

    requestRepo.findByIdAndToUserIdAndStatus = async (id, toUserId, status) =>
      requestsDb.find(
        (r) => r._id === id && r.toUserId === toUserId && r.status === status
      ) ?? null;

    requestRepo.findReceivedRequests = async (toUserId, status) =>
      requestsDb.filter((r) => r.toUserId === toUserId && r.status === status);

    requestRepo.findConnections = async (userId) =>
      requestsDb.filter(
        (r) =>
          (r.fromUserId === userId || r.toUserId === userId) &&
          r.status === 'accepted'
      );

    requestRepo.findConnectionBetween = async (u1, u2) =>
      requestsDb.find(
        (r) =>
          ((r.fromUserId === u1 && r.toUserId === u2) ||
            (r.fromUserId === u2 && r.toUserId === u1)) &&
          r.status === 'accepted'
      ) ?? null;

    requestRepo.findAllRequestsForUser = async (userId) =>
      requestsDb.filter((r) => r.fromUserId === userId || r.toUserId === userId);

    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) await new Promise((r) => server.close(r));
  });

  beforeEach(() => {
    requestsDb = [];
    publishedEvents = [];
  });

  it('POST /request/send/:status/:toUserId creates request and publishes connection.interested to BullMQ', async () => {
    const res = await fetch(`${baseUrl}/request/send/interested/u2`, {
      method: 'POST',
      headers: {
        'x-user-id': 'u1',
        'x-user-name': 'Alice',
      },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, 'interested');
    assert.equal(publishedEvents.length, 1);
    assert.equal(publishedEvents[0].name, EVENTS.CONNECTION_INTERESTED);
    assert.equal(publishedEvents[0].data.toUserId, 'u2');
  });

  it('POST /request/send/:status/:toUserId rejects invalid status, self-requests, and duplicate requests (400)', async () => {
    const badStatus = await fetch(`${baseUrl}/request/send/invalid_status/u2`, {
      method: 'POST',
      headers: { 'x-user-id': 'u1' },
    });
    assert.equal(badStatus.status, 400);

    const selfReq = await fetch(`${baseUrl}/request/send/interested/u1`, {
      method: 'POST',
      headers: { 'x-user-id': 'u1' },
    });
    assert.equal(selfReq.status, 400);
  });

  it('POST /request/review/:status/:requestId accepts request, publishes connection.accepted, and updates /user/connections', async () => {
    const sendRes = await fetch(`${baseUrl}/request/send/interested/u2`, {
      method: 'POST',
      headers: { 'x-user-id': 'u1', 'x-user-name': 'Alice' },
    });
    const { data: createdReq } = await sendRes.json();

    // Verify u2 sees received request
    const receivedRes = await fetch(`${baseUrl}/user/requests/received`, {
      headers: { 'x-user-id': 'u2' },
    });
    const receivedBody = await receivedRes.json();
    assert.equal(receivedBody.data.length, 1);
    assert.equal(receivedBody.data[0].fromUser.firstName, 'Alice');

    // u2 accepts the request
    const reviewRes = await fetch(
      `${baseUrl}/request/review/accepted/${createdReq._id}`,
      {
        method: 'POST',
        headers: { 'x-user-id': 'u2' },
      }
    );
    assert.equal(reviewRes.status, 200);
    assert.equal(publishedEvents.length, 2);
    assert.equal(publishedEvents[1].name, EVENTS.CONNECTION_ACCEPTED);

    // Verify /user/connections & /user/connections/verify/:userId
    const connRes = await fetch(`${baseUrl}/user/connections`, {
      headers: { 'x-user-id': 'u1' },
    });
    const connBody = await connRes.json();
    assert.equal(connBody.data.length, 1);
    assert.equal(connBody.data[0].user.firstName, 'Bob');

    const verifyRes = await fetch(`${baseUrl}/user/connections/verify/u2`, {
      headers: {
        'x-user-id': 'u1',
        'x-internal-service': 'secret',
      },
    });
    const verifyBody = await verifyRes.json();
    assert.equal(verifyBody.data.connected, true);
  });

  it('GET /user/feed excludes users already interacted with', async () => {
    await fetch(`${baseUrl}/request/send/ignored/u2`, {
      method: 'POST',
      headers: { 'x-user-id': 'u1' },
    });

    const feedRes = await fetch(`${baseUrl}/user/feed?page=1&limit=10`, {
      headers: { 'x-user-id': 'u1' },
    });
    assert.equal(feedRes.status, 200);
    const feedBody = await feedRes.json();
    assert.equal(feedBody.data.length, 1);
    assert.equal(feedBody.data[0]._id, 'u3');
  });
});
