import mongoose from 'mongoose';
import { logger } from '@devtinder/shared';

export const connectDB = async () => {
  try {
    const mongoUri =
      process.env.DB_CONNECTION_STRING ||
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb://localhost:27017/devtinder_auth';
    const conn = await mongoose.connect(mongoUri);
    return conn;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', { error: error.message });
    throw error;
  }
};

export default connectDB;
