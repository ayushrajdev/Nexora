import { createConsumer, QUEUES, EVENTS } from '@devtinder/shared';
import emailService from '../services/emailService.js';
import profileClient from '../services/profileClient.js';

export const handleConnectionEventJob = async (
  job,
  mailer = emailService,
  profiles = profileClient
) => {
  const eventName = job.name || job.data?.event;
  const payload = job.data?.payload || job.data;

  if (eventName === EVENTS.CONNECTION_INTERESTED) {
    const { toUserId, fromUserName } = payload;
    const email = await profiles.getUserEmail(toUserId);
    if (email) {
      await mailer.sendInterestEmail(email, fromUserName);
    }
  } else if (eventName === EVENTS.CONNECTION_ACCEPTED) {
    const { toUserId, fromUserId, toUserName, fromUserName } = payload;
    const email1 = await profiles.getUserEmail(toUserId);
    const email2 = await profiles.getUserEmail(fromUserId);

    if (email1 && email2) {
      await mailer.sendMatchEmail(email1, email2, fromUserName, toUserName);
    }
  }
};

export const startConnectionEventConsumer = () => {
  return createConsumer(QUEUES.CONNECTION_EVENTS, (job) =>
    handleConnectionEventJob(job)
  );
};
