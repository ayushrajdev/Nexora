const { createLogger, format, transports } = require('winston');

const SERVICE_NAME = process.env.SERVICE_NAME || 'devtinder';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';

const logger = createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: SERVICE_NAME },
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    NODE_ENV === 'production'
      ? format.json()
      : format.combine(format.colorize(), format.simple())
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
