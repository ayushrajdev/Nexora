import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { errorHandler, logger } from '@devtinder/shared';
import { startUserEventConsumer } from './consumers/userEventConsumer.js';
import { startConnectionEventConsumer } from './consumers/connectionEventConsumer.js';
import { startPaymentEventConsumer } from './consumers/paymentEventConsumer.js';
import { startDailyDigestCron } from './cron/dailyDigest.js';

export const app = express();
app.use(express.json());

// Basic health check
app.get('/health', (_req, res) => res.send('OK'));

app.use(errorHandler);

export const startWorkers = () => {
  startUserEventConsumer();
  startConnectionEventConsumer();
  startPaymentEventConsumer();
  startDailyDigestCron();
};

export const startServer = () => {
  startWorkers();
  const port = process.env.PORT || 3006;
  app.listen(port, () => {
    logger.info(`Notification Service listening on port ${port}`);
  });
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer();
}
