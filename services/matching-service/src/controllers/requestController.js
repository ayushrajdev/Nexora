const matchingService = require('../services/matchingService');
const { sendSuccess } = require('@devtinder/shared');

class RequestController {
  async sendRequest(req, res, next) {
    try {
      const { status, toUserId } = req.params;
      const request = await matchingService.sendRequest(req.user, toUserId, status);
      sendSuccess(res, request);
    } catch (err) {
      next(err);
    }
  }

  async reviewRequest(req, res, next) {
    try {
      const { status, requestId } = req.params;
      const request = await matchingService.reviewRequest(req.user._id, requestId, status);
      sendSuccess(res, request);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RequestController();