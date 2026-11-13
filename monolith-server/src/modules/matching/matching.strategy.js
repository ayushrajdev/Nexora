import { DOMAIN_EVENTS } from '../../core/constants.js';
import { ErrorFactory } from '../../core/errors.js';
import domainEventBus from '../../core/eventBus.js';

/**
 * Matching Action Strategy Pattern:
 * Encapsulates swipe actions ('interested', 'ignored') and review actions ('accepted', 'rejected').
 */

export class InterestedSwipeStrategy {
  async execute({ repo, eventBus, fromUser, toUserId }) {
    const newRequest = await repo.create({
      fromUserId: fromUser._id,
      toUserId,
      status: 'interested',
    });

    await eventBus.publish(DOMAIN_EVENTS.CONNECTION_INTERESTED, {
      fromUserId: fromUser._id,
      toUserId,
      fromUserName: fromUser.firstName,
    });

    return newRequest;
  }
}

export class IgnoredSwipeStrategy {
  async execute({ repo, fromUser, toUserId }) {
    return repo.create({
      fromUserId: fromUser._id,
      toUserId,
      status: 'ignored',
    });
  }
}

export class AcceptedReviewStrategy {
  async execute({ request, eventBus }) {
    request.status = 'accepted';
    await request.save();

    await eventBus.publish(DOMAIN_EVENTS.CONNECTION_ACCEPTED, {
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
    });

    return request;
  }
}

export class RejectedReviewStrategy {
  async execute({ request }) {
    request.status = 'rejected';
    await request.save();
    return request;
  }
}

/**
 * MatchingStrategyFactory — Factory Pattern for resolving swipe and review strategies.
 */
export class MatchingStrategyFactory {
  static swipeStrategies = {
    interested: new InterestedSwipeStrategy(),
    ignored: new IgnoredSwipeStrategy(),
  };

  static reviewStrategies = {
    accepted: new AcceptedReviewStrategy(),
    rejected: new RejectedReviewStrategy(),
  };

  static getSwipeStrategy(status) {
    const strategy = this.swipeStrategies[status];
    if (!strategy) {
      throw ErrorFactory.badRequest('Invalid status type');
    }
    return strategy;
  }

  static getReviewStrategy(status) {
    const strategy = this.reviewStrategies[status];
    if (!strategy) {
      throw ErrorFactory.badRequest('Invalid status type');
    }
    return strategy;
  }
}
