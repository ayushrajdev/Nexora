import mongoose from 'mongoose';
import { logger } from '@devtinder/shared';

export const connectDB = async () => {
  try {
    const mongoUri =
      process.env.DB_CONNECTION_STRING ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/devtinder_matching';
    await mongoose.connect(mongoUri);
    logger.info('Matching Service connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', { error: error.message });
    process.exit(1);
  }
};

export default connectDB;
