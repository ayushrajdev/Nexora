import { createServiceClient } from '@devtinder/shared';

export class ProfileClient {
  constructor() {
    this.client = createServiceClient(
      process.env.PROFILE_SERVICE_URL || 'http://localhost:3002'
    );
  }

  async getUserProfile(userId) {
    const response = await this.client.get('/profile/view', {
      headers: { 'x-user-id': userId.toString() },
    });
    return response.data;
  }
}

export const profileClient = new ProfileClient();
export default profileClient;
