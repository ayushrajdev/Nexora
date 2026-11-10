import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import { fileURLToPath } from 'url';
import { errorHandler, logger } from '@devtinder/shared';
import connectDB from './config/database.js';
import chatRoutes from './routes/chatRoutes.js';
import setupSocket from './socket/socketHandler.js';

export const app = express();
export const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());

app.use('/chat', chatRoutes);

app.use(errorHandler);

export const io = setupSocket(server);

export const startServer = async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 3004;
    server.listen(port, () => {
      logger.info(`Chat Service listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error.message });
    process.exit(1);
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer();
}
