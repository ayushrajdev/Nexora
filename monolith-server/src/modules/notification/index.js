import templates from './email.templates.js';
import {
  NotificationStrategyFactory,
  ConsoleNotificationStrategy,
  AwsSesNotificationStrategy,
} from './notification.strategy.js';
import notificationService, {
  NotificationService,
} from './notification.service.js';

export {
  templates,
  NotificationStrategyFactory,
  ConsoleNotificationStrategy,
  AwsSesNotificationStrategy,
  NotificationService,
  notificationService,
};
