import templates from './email.templates.js';
import { NotificationStrategyFactory } from './notification.strategy.js';
import userService from '../user/user.service.js';
import domainEventBus from '../../core/eventBus.js';
import { DOMAIN_EVENTS } from '../../core/constants.js';
import logger from '../../core/logger.js';

export class NotificationService {
  constructor(
    strategy = NotificationStrategyFactory.create(),
    profiles = userService,
    eventBus = domainEventBus
  ) {
    this.strategy = strategy;
    this.profiles = profiles;
    this.eventBus = eventBus;
  }

  async sendEmail(toAddress, subject, bodyHtml) {
    try {
      return await this.strategy.send(toAddress, subject, bodyHtml);
    } catch (err) {
      logger.error('Error sending notification email:', {
        error: err.message,
      });
      return null;
    }
  }

  async sendWelcomeEmail(email, firstName) {
    return this.sendEmail(
      email,
      'Welcome to DevTinder!',
      templates.welcomeTemplate(firstName)
    );
  }

  async sendInterestEmail(email, senderName) {
    return this.sendEmail(
      email,
      'Someone is interested in your profile!',
      templates.interestTemplate(senderName)
    );
  }

  async sendMatchEmail(email1, email2, name1, name2) {
    await this.sendEmail(
      email1,
      'You have a new match!',
      templates.matchTemplate(name2)
    );
    await this.sendEmail(
      email2,
      'You have a new match!',
      templates.matchTemplate(name1)
    );
  }

  async sendPaymentConfirmationEmail(email, membershipType) {
    return this.sendEmail(
      email,
      'Payment Confirmation',
      templates.paymentConfirmationTemplate(membershipType)
    );
  }

  registerDomainEvents() {
    this.eventBus.subscribe(
      DOMAIN_EVENTS.USER_CREATED,
      async ({ emailId, firstName }) => {
        if (emailId) {
          await this.sendWelcomeEmail(emailId, firstName);
        }
      }
    );

    this.eventBus.subscribe(
      DOMAIN_EVENTS.CONNECTION_INTERESTED,
      async ({ toUserId, fromUserName }) => {
        const email = await this.profiles.getUserEmail(toUserId);
        if (email) {
          await this.sendInterestEmail(email, fromUserName);
        }
      }
    );

    this.eventBus.subscribe(
      DOMAIN_EVENTS.CONNECTION_ACCEPTED,
      async ({ toUserId, fromUserId, toUserName, fromUserName }) => {
        const email1 = await this.profiles.getUserEmail(toUserId);
        const email2 = await this.profiles.getUserEmail(fromUserId);
        if (email1 && email2) {
          await this.sendMatchEmail(email1, email2, fromUserName, toUserName);
        }
      }
    );

    this.eventBus.subscribe(
      DOMAIN_EVENTS.PAYMENT_CAPTURED,
      async ({ userId, membershipType }) => {
        const email = await this.profiles.getUserEmail(userId);
        if (email) {
          await this.sendPaymentConfirmationEmail(email, membershipType);
        }
      }
    );
  }
}

export const notificationService = new NotificationService();
export default notificationService;
