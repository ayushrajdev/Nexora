require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('@devtinder/shared');
const connectDB = require('./config/database');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/payment', paymentRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 3005;
    app.listen(port, () => {
      console.log(`Payment Service listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };