const mongoose = require('mongoose');
const { logger } = require('@devtinder/shared');

const connectDB = async () => {
  try {
    const mongoUri = process.env.DB_CONNECTION_STRING || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/devtinder_auth';
    const conn = await mongoose.connect(mongoUri);
    return conn;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', { error: error.message });
    throw error;
  }
};

module.exports = connectDB;
