require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const http = require('http');
const { errorHandler } = require('@devtinder/shared');
const connectDB = require('./config/database');
const chatRoutes = require('./routes/chatRoutes');
const setupSocket = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());

app.use('/chat', chatRoutes);

app.use(errorHandler);

setupSocket(server);

const startServer = async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 3004;
    server.listen(port, () => {
      console.log(`Chat Service listening on port ${port}`);
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