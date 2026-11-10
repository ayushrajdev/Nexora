import cron from 'node-cron';
import { logger } from '@devtinder/shared';

export const startDailyDigestCron = () => {
  return cron.schedule('0 8 * * *', () => {
    logger.info('Daily digest triggered at 8 AM');
  });
};
