import { createPublisher, publishEvent, EVENTS, QUEUES } from '@devtinder/shared';

let connectionPublisher = null;

const getConnectionPublisher = () => {
  if (!connectionPublisher) {
    connectionPublisher = createPublisher(QUEUES.CONNECTION_EVENTS);
  }
  return connectionPublisher;
};

export const setConnectionPublisher = (customPublisher) => {
  connectionPublisher = customPublisher;
};

export class Publisher {
  async publishConnectionInterested(payload) {
    await publishEvent(
      getConnectionPublisher(),
      EVENTS.CONNECTION_INTERESTED,
      payload
    );
  }

  async publishConnectionAccepted(payload) {
    await publishEvent(
      getConnectionPublisher(),
      EVENTS.CONNECTION_ACCEPTED,
      payload
    );
  }
}

export const publisher = new Publisher();
export default publisher;
