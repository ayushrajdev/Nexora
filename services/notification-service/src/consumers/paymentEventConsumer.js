const { createConsumer, QUEUES, EVENTS } = require('@devtinder/shared');
const emailService = require('../services/emailService');
const profileClient = require('../services/profileClient');

const worker = createConsumer(QUEUES.PAYMENT_EVENTS, async (job) => {
  if (job.name === EVENTS.PAYMENT_CAPTURED) {
    const { userId, membershipType } = job.data;
    const email = await profileClient.getUserEmail(userId);
    if (email) {
      await emailService.sendPaymentConfirmationEmail(email, membershipType);
    }
  }
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed in PAYMENT_EVENTS:`, err);
});