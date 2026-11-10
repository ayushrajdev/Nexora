import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { errorHandler, logger } from '@devtinder/shared';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import oauthRoutes from './routes/oauthRoutes.js';
import { consumePaymentEvents } from './events/consumer.js';

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONT_END_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use('/', authRoutes);
app.use('/oauth', oauthRoutes);

app.use(errorHandler);

export const startServer = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB');

    // Start background consumers
    consumePaymentEvents().catch((err) =>
      logger.error('Error starting payment event consumer', {
        error: err.message,
      })
    );

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer();
}
