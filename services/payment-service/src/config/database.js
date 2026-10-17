const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.DB_CONNECTION_STRING || process.env.MONGODB_URI || 'mongodb://localhost:27017/devtinder_payment';
  await mongoose.connect(mongoUri);
};

module.exports = connectDB;