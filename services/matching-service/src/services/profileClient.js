const { createServiceClient, InternalError } = require('@devtinder/shared');

class ProfileClient {
  constructor() {
    this.client = createServiceClient(
      process.env.PROFILE_SERVICE_URL || 'http://localhost:3002',
      {
        headers: {
          'x-internal-service': process.env.INTERNAL_SERVICE_SECRET || 'secret'
        }
      }
    );
  }

  async getProfile(userId) {
    try {
      const response = await this.client.get(`/profile/${userId}`);
      return response.data.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return null;
      }
      throw new InternalError('Failed to fetch profile');
    }
  }

  async getFeed(selfId, excludeIds, page = 1, limit = 10) {
    try {
      const response = await this.client.get('/profile/feed', {
        params: {
          selfId,
          exclude: excludeIds.join(','),
          page,
          limit
        }
      });
      return response.data.data;
    } catch (err) {
      throw new InternalError('Failed to fetch feed');
    }
  }
}

module.exports = new ProfileClient();
