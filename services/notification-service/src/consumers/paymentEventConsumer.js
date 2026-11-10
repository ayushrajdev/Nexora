import { createConsumer, QUEUES, EVENTS } from '@devtinder/shared';
import emailService from '../services/emailService.js';
import profileClient from '../services/profileClient.js';

export const handlePaymentEventJob = async (
  job,
  mailer = emailService,
  profiles = profileClient
) => {
  const eventName = job.name || job.data?.event;
  const payload = job.data?.payload || job.data;

  if (eventName === EVENTS.PAYMENT_CAPTURED) {
    const { userId, membershipType } = payload;
    const email = await profiles.getUserEmail(userId);
    if (email) {
      await mailer.sendPaymentConfirmationEmail(email, membershipType);
    }
  }
};

export const startPaymentEventConsumer = () => {
  return createConsumer(QUEUES.PAYMENT_EVENTS, (job) =>
    handlePaymentEventJob(job)
  );
};
