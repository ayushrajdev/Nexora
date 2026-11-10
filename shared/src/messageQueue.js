import { Queue, Worker } from 'bullmq';
import { getRedisClient } from './redis.js';
import logger from './logger.js';

/** @type {Map<string, Queue>} */
const publishers = new Map();

/**
 * Create (or retrieve cached) BullMQ publisher (Queue) for a given event channel.
 * @param {string} queueName - The queue/event channel name
 * @returns {Queue}
 */
export const createPublisher = (queueName) => {
  if (publishers.has(queueName)) {
    return publishers.get(queueName);
  }

  const queue = new Queue(queueName, {
    connection: getRedisClient(),
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  });

  publishers.set(queueName, queue);
  logger.info(`MQ publisher created for queue: ${queueName}`);
  return queue;
};

/**
 * Create a BullMQ consumer (Worker) for a given event channel.
 * @param {string}   queueName   - The queue/event channel name
 * @param {Function} handler     - Async function(job) to process each message
 * @param {object}   [options]   - Additional BullMQ Worker options
 * @returns {Worker}
 */
export const createConsumer = (queueName, handler, options = {}) => {
  const worker = new Worker(queueName, handler, {
    connection: getRedisClient(),
    concurrency: 5,
    ...options,
  });

  worker.on('completed', (job) => {
    logger.debug(`Job ${job.id} in ${queueName} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} in ${queueName} failed: ${err.message}`);
  });

  logger.info(`MQ consumer created for queue: ${queueName}`);
  return worker;
};

/**
 * Publish a named event with payload to a queue.
 * Accepts either a Queue instance or a queueName string.
 * @param {Queue|string} publisherOrQueueName - BullMQ Queue instance or queue name string
 * @param {string}       eventName            - Descriptive job/event name
 * @param {object}       payload              - The event data
 */
export const publishEvent = async (publisherOrQueueName, eventName, payload) => {
  const queue =
    typeof publisherOrQueueName === 'string'
      ? createPublisher(publisherOrQueueName)
      : publisherOrQueueName;

  const job = await queue.add(eventName, payload);
  logger.info(`Event published: ${eventName} (jobId: ${job.id})`);
  return job;
};

/**
 * Clears cached publishers (useful for tests/shutdown).
 */
export const closePublishers = async () => {
  for (const queue of publishers.values()) {
    await queue.close();
  }
  publishers.clear();
};
