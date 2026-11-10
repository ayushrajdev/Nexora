import { createServiceClient, logger } from '@devtinder/shared';

export class ProfileClient {
  constructor() {
    this.client = createServiceClient(
      process.env.PROFILE_SERVICE_URL || 'http://localhost:3002'
    );
  }

  async getUserEmail(userId) {
    try {
      const response = await this.client.get('/profile/view', {
        headers: { 'x-user-id': userId.toString() },
      });
      return response.data?.data?.emailId;
    } catch (error) {
      logger.error('Failed to get user email:', { error: error.message });
      return null;
    }
  }
}

export const profileClient = new ProfileClient();
export default profileClient;
