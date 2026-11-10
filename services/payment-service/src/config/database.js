import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri =
    process.env.DB_CONNECTION_STRING ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/devtinder_payment';
  await mongoose.connect(mongoUri);
};

export default connectDB;
