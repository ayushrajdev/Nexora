import mongoose from 'mongoose';
import env from './env.js';
import logger from '../core/logger.js';

export const connectDatabase = async (uri = env.DB_CONNECTION_STRING) => {
  await mongoose.connect(uri);
  logger.info('Connected to Monolith MongoDB');
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
  logger.info('Disconnected from Monolith MongoDB');
};

export default { connectDatabase, disconnectDatabase };
