import { createServiceClient } from '@devtinder/shared';

export class MatchingClient {
  constructor() {
    this.client = createServiceClient(
      process.env.MATCHING_SERVICE_URL || 'http://localhost:3003',
      {
        headers: {
          'x-internal-service':
            process.env.INTERNAL_SERVICE_SECRET || 'secret',
        },
      }
    );
  }

  async verifyConnection(userId, targetUserId) {
    try {
      const response = await this.client.get(
        `/user/connections/verify/${targetUserId}`,
        {
          headers: { 'x-user-id': userId.toString() },
        }
      );
      return Boolean(response.data?.data?.connected ?? response.data?.connected);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        return false;
      }
      throw error;
    }
  }
}

export const matchingClient = new MatchingClient();
export default matchingClient;
