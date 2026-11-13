import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import env from '../../config/env.js';
import logger from '../../core/logger.js';

/**
 * Notification Provider Strategy Pattern:
 * - send(toAddress, subject, bodyHtml)
 */

export class ConsoleNotificationStrategy {
  async send(toAddress, subject, bodyHtml) {
    logger.info(`[ConsoleNotification] To: ${toAddress} | Subject: ${subject}`);
    return { provider: 'console', toAddress, subject, bodyHtml };
  }
}

export class AwsSesNotificationStrategy {
  constructor() {
    this.sesClient = new SESClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY,
        secretAccessKey: env.AWS_SECRET_KEY,
      },
    });
  }

  async send(toAddress, subject, bodyHtml) {
    const params = {
      Source: env.SES_FROM_EMAIL,
      Destination: { ToAddresses: [toAddress] },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: bodyHtml } },
      },
    };
    const command = new SendEmailCommand(params);
    return this.sesClient.send(command);
  }
}

/**
 * NotificationStrategyFactory — Factory Pattern for resolving notification delivery strategy.
 */
export class NotificationStrategyFactory {
  static create(type = env.NOTIFICATION_PROVIDER) {
    if (type === 'ses' && env.NODE_ENV === 'production') {
      return new AwsSesNotificationStrategy();
    }
    return new ConsoleNotificationStrategy();
  }
}
