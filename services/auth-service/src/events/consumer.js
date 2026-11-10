import { createConsumer, QUEUES, EVENTS, logger } from '@devtinder/shared';
import userRepository from '../repositories/userRepository.js';

export const handlePaymentEventJob = async (job, repo = userRepository) => {
  const eventName = job.name || job.data?.event;
  const payload = job.data?.payload || job.data;

  if (eventName === EVENTS.PAYMENT_CAPTURED) {
    const { userId, membershipType } = payload;
    try {
      await repo.updateMembership(userId, true, membershipType);
      logger.info(`Successfully updated membership for user ${userId} to ${membershipType}`);
    } catch (error) {
      logger.error(`Error updating membership for user ${userId}`, { error: error.message });
      throw error;
    }
  }
};

export const consumePaymentEvents = async () => {
  const worker = createConsumer(QUEUES.PAYMENT_EVENTS, (job) => handlePaymentEventJob(job));
  logger.info(`Started consumer for ${QUEUES.PAYMENT_EVENTS}`);
  return worker;
};
