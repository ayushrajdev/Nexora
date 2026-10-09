const mongoose = require('mongoose');
const { logger } = require('@devtinder/shared');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    return conn;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', { error: error.message });
    throw error;
  }
};

module.exports = connectDB;
