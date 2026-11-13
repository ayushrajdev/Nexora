import matchingService from './matching.service.js';
import { sendSuccess } from '../../core/responseFormatter.js';

export class MatchingController {
  constructor(service = matchingService) {
    this.service = service;
  }

  sendRequest = async (req, res, next) => {
    try {
      const { status, toUserId } = req.params;
      const request = await this.service.sendRequest(
        req.user,
        toUserId,
        status
      );
      sendSuccess(res, request);
    } catch (err) {
      next(err);
    }
  };

  reviewRequest = async (req, res, next) => {
    try {
      const { status, requestId } = req.params;
      const request = await this.service.reviewRequest(
        req.user._id,
        requestId,
        status
      );
      sendSuccess(res, request);
    } catch (err) {
      next(err);
    }
  };

  getReceivedRequests = async (req, res, next) => {
    try {
      const requests = await this.service.getReceivedRequests(req.user._id);
      sendSuccess(res, requests);
    } catch (err) {
      next(err);
    }
  };

  getConnections = async (req, res, next) => {
    try {
      const connections = await this.service.getConnections(req.user._id);
      sendSuccess(res, connections);
    } catch (err) {
      next(err);
    }
  };

  getFeed = async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const users = await this.service.getFeed(req.user._id, page, limit);
      sendSuccess(res, users);
    } catch (err) {
      next(err);
    }
  };

  verifyConnection = async (req, res, next) => {
    try {
      const userId1 = req.user?._id || req.headers['x-user-id'];
      const userId2 = req.params.userId;
      const result = await this.service.verifyConnection(userId1, userId2);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}

export const matchingController = new MatchingController();
export default matchingController;
