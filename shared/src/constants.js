/**
 * Shared constants used across multiple microservices.
 */

// ──────────────────────────────────────────
//  Message Queue — Event / Queue Names
// ──────────────────────────────────────────
const QUEUES = Object.freeze({
  USER_EVENTS: 'user-events',
  CONNECTION_EVENTS: 'connection-events',
  PAYMENT_EVENTS: 'payment-events',
  NOTIFICATION_EVENTS: 'notification-events',
});

const EVENTS = Object.freeze({
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_PREMIUM_UPGRADED: 'user.premium.upgraded',

  CONNECTION_INTERESTED: 'connection.interested',
  CONNECTION_ACCEPTED: 'connection.accepted',
  CONNECTION_REJECTED: 'connection.rejected',

  PAYMENT_CAPTURED: 'payment.captured',
  PAYMENT_FAILED: 'payment.failed',
});

// ──────────────────────────────────────────
//  Service URLs (internal Docker network)
// ──────────────────────────────────────────
const SERVICES = Object.freeze({
  AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  PROFILE: process.env.PROFILE_SERVICE_URL || 'http://localhost:3002',
  MATCHING: process.env.MATCHING_SERVICE_URL || 'http://localhost:3003',
  CHAT: process.env.CHAT_SERVICE_URL || 'http://localhost:3004',
  PAYMENT: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
});

// ──────────────────────────────────────────
//  Business Constants
// ──────────────────────────────────────────
const MEMBERSHIP_AMOUNT = Object.freeze({
  silver: 300,  // INR
  gold: 700,    // INR
});

const ALLOWED_PROFILE_UPDATES = Object.freeze([
  'firstName',
  'lastName',
  'photoUrl',
  'gender',
  'age',
  'about',
  'skills',
]);

const CONNECTION_STATUS = Object.freeze({
  IGNORED: 'ignored',
  INTERESTED: 'interested',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});

const GENDER = Object.freeze({
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
});

const USER_SAFE_FIELDS = 'firstName lastName photoUrl age gender about skills';

const COOKIE_NAME = 'sid';

module.exports = {
  QUEUES,
  EVENTS,
  SERVICES,
  MEMBERSHIP_AMOUNT,
  ALLOWED_PROFILE_UPDATES,
  CONNECTION_STATUS,
  GENDER,
  USER_SAFE_FIELDS,
  COOKIE_NAME,
};
