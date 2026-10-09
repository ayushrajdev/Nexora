const { createConsumer, QUEUES, EVENTS } = require('@devtinder/shared');
const emailService = require('../services/emailService');

const worker = createConsumer(QUEUES.USER_EVENTS, async (job) => {
  if (job.name === EVENTS.USER_CREATED) {
    const { emailId, firstName } = job.data;
    if (emailId) {
      await emailService.sendWelcomeEmail(emailId, firstName);
    }
  }
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed in USER_EVENTS:`, err);
});