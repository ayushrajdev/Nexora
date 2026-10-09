const { publishEvent, QUEUES, EVENTS, logger } = require('@devtinder/shared');

const publishUserCreated = async (user) => {
  try {
    await publishEvent(QUEUES.USER_EVENTS, EVENTS.USER_CREATED, {
      userId: user._id.toString(),
      firstName: user.firstName,
      emailId: user.emailId
    });
    logger.info(`Published ${EVENTS.USER_CREATED} event for user ${user._id}`);
  } catch (error) {
    logger.error(`Error publishing ${EVENTS.USER_CREATED} event`, { error: error.message });
  }
};

module.exports = {
  publishUserCreated
};
