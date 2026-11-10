import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { errorHandler, logger } from '@devtinder/shared';
import connectDB from './config/database.js';
import requestRoutes from './routes/requestRoutes.js';
import userRoutes from './routes/userRoutes.js';

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/request', requestRoutes);
app.use('/user', userRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3003;

export const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Matching Service listening on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', { error: err.message });
    process.exit(1);
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer();
}
