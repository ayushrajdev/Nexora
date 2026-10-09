const { createServiceClient } = require('@devtinder/shared');

const matchingClient = createServiceClient(process.env.MATCHING_SERVICE_URL || 'http://localhost:3003');

class MatchingClient {
  async verifyConnection(userId, targetUserId) {
    try {
      const response = await matchingClient.get(`/user/connections/verify/${targetUserId}`, {
        headers: { 'x-user-id': userId.toString() }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        return false;
      }
      throw error;
    }
  }
}

module.exports = new MatchingClient();