const { createConsumer, QUEUES, EVENTS } = require('@devtinder/shared');
const emailService = require('../services/emailService');
const profileClient = require('../services/profileClient');

const worker = createConsumer(QUEUES.CONNECTION_EVENTS, async (job) => {
  if (job.name === EVENTS.CONNECTION_INTERESTED) {
    const { toUserId, fromUserName } = job.data;
    const email = await profileClient.getUserEmail(toUserId);
    if (email) {
      await emailService.sendInterestEmail(email, fromUserName);
    }
  } else if (job.name === EVENTS.CONNECTION_ACCEPTED) {
    const { toUserId, fromUserId, toUserName, fromUserName } = job.data;
    const email1 = await profileClient.getUserEmail(toUserId);
    const email2 = await profileClient.getUserEmail(fromUserId);
    
    if (email1 && email2) {
      await emailService.sendMatchEmail(email1, email2, fromUserName, toUserName);
    }
  }
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed in CONNECTION_EVENTS:`, err);
});