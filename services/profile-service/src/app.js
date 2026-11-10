import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { errorHandler, logger } from '@devtinder/shared';
import connectDB from './config/database.js';
import profileRoutes from './routes/profileRoutes.js';

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/', profileRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3002;

export const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Profile Service listening on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', { error: err.message });
    process.exit(1);
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer();
}
