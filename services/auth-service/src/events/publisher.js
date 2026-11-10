import { createPublisher, publishEvent, QUEUES, EVENTS, logger } from '@devtinder/shared';

let userEventsPublisher = null;

const getUserPublisher = () => {
  if (!userEventsPublisher) {
    userEventsPublisher = createPublisher(QUEUES.USER_EVENTS);
  }
  return userEventsPublisher;
};

export const setUserPublisher = (customPublisher) => {
  userEventsPublisher = customPublisher;
};

export const publishUserCreated = async (user) => {
  try {
    const publisher = getUserPublisher();
    await publishEvent(publisher, EVENTS.USER_CREATED, {
      userId: user._id.toString(),
      firstName: user.firstName,
      emailId: user.emailId,
    });
    logger.info(`Published ${EVENTS.USER_CREATED} event for user ${user._id}`);
  } catch (error) {
    logger.error(`Error publishing ${EVENTS.USER_CREATED} event`, { error: error.message });
  }
};
