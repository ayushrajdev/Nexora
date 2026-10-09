const { Queue, Worker } = require('bullmq');
const { getRedisClient } = require('./redis');
const logger = require('./logger');

/**
 * Create a BullMQ publisher (Queue) for a given event channel.
 * @param {string} queueName - The queue/event channel name
 * @returns {Queue}
 */
const createPublisher = (queueName) => {
  const queue = new Queue(queueName, {
    connection: getRedisClient(),
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  });

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
const createConsumer = (queueName, handler, options = {}) => {
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
 * @param {Queue}  publisher  - The BullMQ Queue instance
 * @param {string} eventName  - A descriptive job name
 * @param {object} payload    - The event data
 */
const publishEvent = async (publisher, eventName, payload) => {
  const job = await publisher.add(eventName, payload);
  logger.info(`Event published: ${eventName} (jobId: ${job.id})`);
  return job;
};

module.exports = { createPublisher, createConsumer, publishEvent };
