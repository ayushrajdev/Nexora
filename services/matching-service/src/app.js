require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('@devtinder/shared');
const connectDB = require('./config/database');
const requestRoutes = require('./routes/requestRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/request', requestRoutes);
app.use('/user', userRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3003;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Matching Service listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };\n