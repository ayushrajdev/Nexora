require('dotenv').config();

module.exports = {
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  PROFILE_SERVICE_URL: process.env.PROFILE_SERVICE_URL || 'http://localhost:3002',
  MATCHING_SERVICE_URL: process.env.MATCHING_SERVICE_URL || 'http://localhost:3003',
  CHAT_SERVICE_URL: process.env.CHAT_SERVICE_URL || 'http://localhost:3004',
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
  FRONT_END_URL: process.env.FRONT_END_URL || 'http://localhost:5173',
  PORT: process.env.PORT || 3000
};
