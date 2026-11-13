import connectionRequestRepository from './matching.repository.js';
import { MatchingStrategyFactory } from './matching.strategy.js';
import userService from '../user/user.service.js';
import domainEventBus from '../../core/eventBus.js';
import { ErrorFactory } from '../../core/errors.js';

export class MatchingService {
  constructor(
    repo = connectionRequestRepository,
    profiles = userService,
    eventBus = domainEventBus
  ) {
    this.repo = repo;
    this.profiles = profiles;
    this.eventBus = eventBus;
  }

  async sendRequest(fromUser, toUserId, status) {
    const strategy = MatchingStrategyFactory.getSwipeStrategy(status);

    if (fromUser._id.toString() === toUserId.toString()) {
      throw ErrorFactory.badRequest(
        'Cannot send connection request to yourself!'
      );
    }

    let toUser = null;
    try {
      toUser = await this.profiles.getSafeProfile(toUserId);
    } catch {
      toUser = null;
    }

    if (!toUser) {
      throw ErrorFactory.notFound('User not found');
    }

    const existingRequest = await this.repo.findExistingRequest(
      fromUser._id,
      toUserId
    );
    if (existingRequest) {
      throw ErrorFactory.badRequest('Connection request already exists');
    }

    return strategy.execute({
      repo: this.repo,
      eventBus: this.eventBus,
      fromUser,
      toUserId,
    });
  }

  async reviewRequest(userId, requestId, status) {
    const strategy = MatchingStrategyFactory.getReviewStrategy(status);

    const request = await this.repo.findByIdAndToUserIdAndStatus(
      requestId,
      userId,
      'interested'
    );
    if (!request) {
      throw ErrorFactory.notFound('Connection request not found or invalid');
    }

    return strategy.execute({
      request,
      eventBus: this.eventBus,
    });
  }

  async getReceivedRequests(userId) {
    const requests = await this.repo.findReceivedRequests(
      userId,
      'interested'
    );

    const requestsWithProfiles = await Promise.all(
      requests.map(async (req) => {
        let profile = null;
        try {
          profile = await this.profiles.getSafeProfile(req.fromUserId);
        } catch {
          profile = null;
        }
        const obj = req.toObject ? req.toObject() : { ...req };
        return { ...obj, fromUser: profile };
      })
    );

    return requestsWithProfiles;
  }

  async getConnections(userId) {
    const requests = await this.repo.findConnections(userId);

    const connections = await Promise.all(
      requests.map(async (req) => {
        const otherUserId =
          req.fromUserId.toString() === userId.toString()
            ? req.toUserId
            : req.fromUserId;
        let profile = null;
        try {
          profile = await this.profiles.getSafeProfile(otherUserId);
        } catch {
          profile = null;
        }
        const obj = req.toObject ? req.toObject() : { ...req };
        return { ...obj, user: profile };
      })
    );

    return connections;
  }

  async getFeed(userId, page, limit) {
    const allRequests = await this.repo.findAllRequestsForUser(userId);
    const excludeIds = new Set();

    allRequests.forEach((req) => {
      excludeIds.add(req.fromUserId.toString());
      excludeIds.add(req.toUserId.toString());
    });

    return this.profiles.getFeed(
      userId,
      Array.from(excludeIds),
      page,
      limit
    );
  }

  async verifyConnection(userId1, userId2) {
    const connection = await this.repo.findConnectionBetween(userId1, userId2);
    return { connected: Boolean(connection) };
  }
}

export const matchingService = new MatchingService();
export default matchingService;
