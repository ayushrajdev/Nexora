const matchingService = require('../services/matchingService');
const { sendSuccess } = require('@devtinder/shared');

class UserController {
  async getReceivedRequests(req, res, next) {
    try {
      const requests = await matchingService.getReceivedRequests(req.user._id);
      sendSuccess(res, requests);
    } catch (err) {
      next(err);
    }
  }

  async getConnections(req, res, next) {
    try {
      const connections = await matchingService.getConnections(req.user._id);
      sendSuccess(res, connections);
    } catch (err) {
      next(err);
    }
  }

  async getFeed(req, res, next) {
    try {
      const { page, limit } = req.query;
      const users = await matchingService.getFeed(req.user._id, page, limit);
      sendSuccess(res, users);
    } catch (err) {
      next(err);
    }
  }

  async verifyConnection(req, res, next) {
    try {
      const userId1 = req.headers['x-user-id'];
      const userId2 = req.params.userId;
      const result = await matchingService.verifyConnection(userId1, userId2);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();