import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load exclusively from monolith-server/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  FRONT_END_URL: process.env.FRONT_END_URL || 'http://localhost:5173',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  DB_CONNECTION_STRING:
    process.env.DB_CONNECTION_STRING ||
    'mongodb://localhost:27017/devtinder_monolith',

  SESSION_STORE_TYPE: process.env.SESSION_STORE_TYPE || 'memory',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  SESSION_TTL: parseInt(process.env.SESSION_TTL || '86400', 10),

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'dummy_google_client_id',
  GOOGLE_CLIENT_SECRET:
    process.env.GOOGLE_CLIENT_SECRET || 'dummy_google_client_secret',
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:3000/auth/oauth/google/callback',

  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || 'dummy_github_client_id',
  GITHUB_CLIENT_SECRET:
    process.env.GITHUB_CLIENT_SECRET || 'dummy_github_client_secret',
  GITHUB_CALLBACK_URL:
    process.env.GITHUB_CALLBACK_URL ||
    'http://localhost:3000/auth/oauth/github/callback',

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
  RAZORPAY_KEY_SECRET:
    process.env.RAZORPAY_KEY_SECRET || 'dummy_razorpay_secret',
  RAZORPAY_WEBHOOK_SECRET:
    process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret',

  NOTIFICATION_PROVIDER: process.env.NOTIFICATION_PROVIDER || 'console',
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY || 'dummy_aws_key',
  AWS_SECRET_KEY: process.env.AWS_SECRET_KEY || 'dummy_aws_secret',
  SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || 'noreply@devtinder.in',
});

export default env;
