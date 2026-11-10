import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { errorHandler, logger } from '@devtinder/shared';
import connectDB from './config/database.js';
import paymentRoutes from './routes/paymentRoutes.js';

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/payment', paymentRoutes);

app.use(errorHandler);

export const startServer = async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 3005;
    app.listen(port, () => {
      logger.info(`Payment Service listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error.message });
    process.exit(1);
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer();
}
