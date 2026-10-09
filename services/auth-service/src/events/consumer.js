const { createConsumer, QUEUES, EVENTS, logger } = require('@devtinder/shared');
const userRepository = require('../repositories/userRepository');

const consumePaymentEvents = async () => {
  const handler = async (job) => {
    const { event, payload } = job.data;
    
    if (event === EVENTS.PAYMENT_CAPTURED) {
      const { userId, membershipType } = payload;
      try {
        await userRepository.updateMembership(userId, true, membershipType);
        logger.info(`Successfully updated membership for user ${userId} to ${membershipType}`);
      } catch (error) {
        logger.error(`Error updating membership for user ${userId}`, { error: error.message });
        throw error;
      }
    }
  };

  createConsumer(QUEUES.PAYMENT_EVENTS, handler);
  logger.info(`Started consumer for ${QUEUES.PAYMENT_EVENTS}`);
};

module.exports = { consumePaymentEvents };
