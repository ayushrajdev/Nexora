const { createServiceClient } = require('@devtinder/shared');

const profileClient = createServiceClient(process.env.PROFILE_SERVICE_URL || 'http://localhost:3002');

class ProfileClient {
  async getUserProfile(userId) {
    const response = await profileClient.get('/profile/view', {
      headers: { 'x-user-id': userId.toString() }
    });
    return response.data;
  }
}

module.exports = new ProfileClient();