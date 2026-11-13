export const DOMAIN_EVENTS = Object.freeze({
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_PREMIUM_UPGRADED: 'user.premium.upgraded',

  CONNECTION_INTERESTED: 'connection.interested',
  CONNECTION_ACCEPTED: 'connection.accepted',
  CONNECTION_REJECTED: 'connection.rejected',

  PAYMENT_CAPTURED: 'payment.captured',
  PAYMENT_FAILED: 'payment.failed',
});

export const MEMBERSHIP_AMOUNT = Object.freeze({
  silver: 300, // INR
  gold: 700,   // INR
});

export const ALLOWED_PROFILE_UPDATES = Object.freeze([
  'firstName',
  'lastName',
  'photoUrl',
  'gender',
  'age',
  'about',
  'skills',
]);

export const CONNECTION_STATUS = Object.freeze({
  IGNORED: 'ignored',
  INTERESTED: 'interested',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});

export const GENDER = Object.freeze({
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
});

export const USER_SAFE_FIELDS = [
  '_id',
  'firstName',
  'lastName',
  'photoUrl',
  'age',
  'gender',
  'about',
  'skills',
  'isPremium',
  'membershipType',
];

export const COOKIE_NAME = 'sid';
export const SESSION_PREFIX = 'session:';
