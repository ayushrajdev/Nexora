const axios = require('axios');
const userRepository = require('../repositories/userRepository');
const sessionService = require('./sessionService');
const { publishUserCreated } = require('../events/publisher');
const oauthConfig = require('../config/oauth');
const crypto = require('crypto');
const { InternalError } = require('@devtinder/shared');

class OauthService {
  getGoogleAuthUrl() {
    const state = crypto.randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      client_id: oauthConfig.google.clientId,
      redirect_uri: oauthConfig.google.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state
    });
    return `${oauthConfig.google.authUrl}?${params.toString()}`;
  }

  async handleGoogleCallback(code, req, res) {
    try {
      // Exchange code for token
      const tokenResponse = await axios.post(oauthConfig.google.tokenUrl, {
        client_id: oauthConfig.google.clientId,
        client_secret: oauthConfig.google.clientSecret,
        code,
        redirect_uri: oauthConfig.google.redirectUri,
        grant_type: 'authorization_code'
      });

      const { access_token } = tokenResponse.data;

      // Get user info
      const userInfoResponse = await axios.get(oauthConfig.google.userInfoUrl, {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const profile = userInfoResponse.data;
      
      return await this._findOrCreateOauthUser('google', profile.sub, {
        firstName: profile.given_name,
        lastName: profile.family_name,
        emailId: profile.email,
        photoUrl: profile.picture
      }, req, res);

    } catch (error) {
      throw new InternalError('Failed to authenticate with Google');
    }
  }

  getGithubAuthUrl() {
    const params = new URLSearchParams({
      client_id: oauthConfig.github.clientId,
      redirect_uri: oauthConfig.github.redirectUri,
      scope: 'user:email read:user'
    });
    return `${oauthConfig.github.authUrl}?${params.toString()}`;
  }

  async handleGithubCallback(code, req, res) {
    try {
      // Exchange code for token
      const tokenResponse = await axios.post(oauthConfig.github.tokenUrl, {
        client_id: oauthConfig.github.clientId,
        client_secret: oauthConfig.github.clientSecret,
        code,
        redirect_uri: oauthConfig.github.redirectUri
      }, {
        headers: { Accept: 'application/json' }
      });

      const { access_token } = tokenResponse.data;

      // Get user info
      const userInfoResponse = await axios.get(oauthConfig.github.userUrl, {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const profile = userInfoResponse.data;

      // GitHub might not return email if it's private, so we need to fetch emails
      let emailId = profile.email;
      if (!emailId) {
        const emailsResponse = await axios.get(oauthConfig.github.userEmailsUrl, {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        const primaryEmail = emailsResponse.data.find(e => e.primary);
        emailId = primaryEmail ? primaryEmail.email : null;
      }
      
      const nameParts = (profile.name || profile.login).split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      return await this._findOrCreateOauthUser('github', profile.id.toString(), {
        firstName,
        lastName,
        emailId,
        photoUrl: profile.avatar_url
      }, req, res);

    } catch (error) {
      throw new InternalError('Failed to authenticate with GitHub');
    }
  }

  async _findOrCreateOauthUser(provider, oauthId, profileData, req, res) {
    let user = await userRepository.findByOauthId(provider, oauthId);

    if (!user) {
      // Check if user exists with the same email
      if (profileData.emailId) {
        const existingUser = await userRepository.findByEmail(profileData.emailId);
        if (existingUser) {
           // Link account or just use existing (simplest: just throw error or link)
           // If user exists, we can link them if they don't have a provider yet
           if (!existingUser.oauthProvider) {
               existingUser.oauthProvider = provider;
               existingUser.oauthId = oauthId;
               await existingUser.save();
               user = existingUser;
           } else {
             throw new InternalError(`Email already used by ${existingUser.oauthProvider || 'password'} account`);
           }
        }
      }
      
      if (!user) {
        // Create new user
        user = await userRepository.create({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          emailId: profileData.emailId || `${provider}_${oauthId}@example.com`,
          photoUrl: profileData.photoUrl,
          oauthProvider: provider,
          oauthId: oauthId
        });
        
        // Publish event
        await publishUserCreated(user);
      }
    }

    // Create session
    await sessionService.createSession(user, req, res);
    
    return user;
  }
}

module.exports = new OauthService();
