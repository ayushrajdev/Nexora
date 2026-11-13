import logger from './logger.js';

/**
 * DomainEventBus — Observer / Publish-Subscribe Pattern.
 * Replaces distributed BullMQ message queues inside the modular monolith,
 * allowing modules (Auth, Matching, Payment, Notification) to stay decoupled.
 */
export class DomainEventBus {
  constructor() {
    /** @type {Map<string, Array<(payload: any) => Promise<void> | void>>} */
    this.handlers = new Map();
  }

  /**
   * Subscribe an async or sync listener to a domain event.
   * @param {string} eventName
   * @param {(payload: any) => Promise<void> | void} handler
   */
  subscribe(eventName, handler) {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName).push(handler);
  }

  /**
   * Publish a domain event to all subscribed module handlers.
   * @param {string} eventName
   * @param {any} payload
   */
  async publish(eventName, payload) {
    const listeners = this.handlers.get(eventName) || [];
    logger.info(`DomainEvent published: ${eventName}`);

    for (const handler of listeners) {
      try {
        await handler(payload);
      } catch (err) {
        logger.error(`Error in domain event handler for ${eventName}:`, {
          error: err.message,
        });
      }
    }
  }

  clear() {
    this.handlers.clear();
  }
}

export const domainEventBus = new DomainEventBus();
export default domainEventBus;
