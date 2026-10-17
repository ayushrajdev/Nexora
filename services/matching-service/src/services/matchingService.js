const requestRepo = require('../repositories/connectionRequestRepository');
const profileClient = require('./profileClient');
const publisher = require('../events/publisher');
const { BadRequestError, NotFoundError } = require('@devtinder/shared');

class MatchingService {
  async sendRequest(fromUser, toUserId, status) {
    if (!['ignored', 'interested'].includes(status)) {
      throw new BadRequestError('Invalid status type');
    }

    const toUser = await profileClient.getProfile(toUserId);
    if (!toUser) {
      throw new NotFoundError('User not found');
    }

    const existingRequest = await requestRepo.findExistingRequest(fromUser._id, toUserId);
    if (existingRequest) {
      throw new BadRequestError('Connection request already exists');
    }

    const newRequest = await requestRepo.create({
      fromUserId: fromUser._id,
      toUserId,
      status
    });

    if (status === 'interested') {
      await publisher.publishConnectionInterested({
        fromUserId: fromUser._id,
        toUserId,
        fromUserName: fromUser.firstName
      });
    }

    return newRequest;
  }

  async reviewRequest(userId, requestId, status) {
    if (!['accepted', 'rejected'].includes(status)) {
      throw new BadRequestError('Invalid status type');
    }

    const request = await requestRepo.findByIdAndToUserIdAndStatus(requestId, userId, 'interested');
    if (!request) {
      throw new NotFoundError('Connection request not found or invalid');
    }

    request.status = status;
    await request.save();

    if (status === 'accepted') {
      await publisher.publishConnectionAccepted({
        fromUserId: request.fromUserId,
        toUserId: request.toUserId
      });
    }

    return request;
  }

  async getReceivedRequests(userId) {
    const requests = await requestRepo.findReceivedRequests(userId, 'interested');
    
    const requestsWithProfiles = await Promise.all(requests.map(async (req) => {
      const profile = await profileClient.getProfile(req.fromUserId);
      return { ...req.toObject(), fromUser: profile };
    }));
    
    return requestsWithProfiles;
  }

  async getConnections(userId) {
    const requests = await requestRepo.findConnections(userId);
    
    const connections = await Promise.all(requests.map(async (req) => {
      const otherUserId = req.fromUserId.toString() === userId.toString() ? req.toUserId : req.fromUserId;
      const profile = await profileClient.getProfile(otherUserId);
      return { ...req.toObject(), user: profile };
    }));
    
    return connections;
  }

  async getFeed(userId, page, limit) {
    const allRequests = await requestRepo.findAllRequestsForUser(userId);
    const excludeIds = new Set();
    
    allRequests.forEach(req => {
      excludeIds.add(req.fromUserId.toString());
      excludeIds.add(req.toUserId.toString());
    });
    
    const users = await profileClient.getFeed(userId, Array.from(excludeIds), page, limit);
    return users;
  }

  async verifyConnection(userId1, userId2) {
    const connection = await requestRepo.findConnectionBetween(userId1, userId2);
    return { connected: !!connection };
  }
}

module.exports = new MatchingService();
