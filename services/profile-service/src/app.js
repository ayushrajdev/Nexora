require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('@devtinder/shared');
const connectDB = require('./config/database');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/', profileRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3002;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Profile Service listening on port ${PORT}`);
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