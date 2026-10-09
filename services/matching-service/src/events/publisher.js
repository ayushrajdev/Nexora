const { publishEvent, EVENTS, QUEUES } = require('@devtinder/shared');

class Publisher {
  async publishConnectionInterested(payload) {
    await publishEvent(QUEUES.CONNECTION_EVENTS, EVENTS.CONNECTION_INTERESTED, payload);
  }

  async publishConnectionAccepted(payload) {
    await publishEvent(QUEUES.CONNECTION_EVENTS, EVENTS.CONNECTION_ACCEPTED, payload);
  }
}

module.exports = new Publisher();