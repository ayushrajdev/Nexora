const { createServiceClient } = require('@devtinder/shared');

const profileClient = createServiceClient(process.env.PROFILE_SERVICE_URL || 'http://localhost:3002');

class ProfileClient {
  async getUserEmail(userId) {
    try {
      const response = await profileClient.get('/profile/view', {
        headers: { 'x-user-id': userId.toString() }
      });
      return response.data?.data?.emailId;
    } catch (error) {
      console.error('Failed to get user email:', error.message);
      return null;
    }
  }
}

module.exports = new ProfileClient();