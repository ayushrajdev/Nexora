import { createConsumer, QUEUES, EVENTS } from '@devtinder/shared';
import emailService from '../services/emailService.js';

export const handleUserEventJob = async (job, mailer = emailService) => {
  const eventName = job.name || job.data?.event;
  const payload = job.data?.payload || job.data;

  if (eventName === EVENTS.USER_CREATED) {
    const { emailId, firstName } = payload;
    if (emailId) {
      await mailer.sendWelcomeEmail(emailId, firstName);
    }
  }
};

export const startUserEventConsumer = () => {
  return createConsumer(QUEUES.USER_EVENTS, (job) => handleUserEventJob(job));
};
