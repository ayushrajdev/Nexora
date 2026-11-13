import { createLogger, format, transports } from 'winston';
import env from '../config/env.js';

export const logger = createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: 'devtinder-monolith' },
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    env.NODE_ENV === 'production'
      ? format.json()
      : format.combine(format.colorize(), format.simple())
  ),
  transports: [new transports.Console()],
});

export default logger;
