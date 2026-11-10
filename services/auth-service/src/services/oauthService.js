import axios from 'axios';
import crypto from 'crypto';
import userRepository from '../repositories/userRepository.js';
import sessionService from './sessionService.js';
import { publishUserCreated } from '../events/publisher.js';
import oauthConfig from '../config/oauth.js';
import { InternalError } from '@devtinder/shared';

export class OauthService {
  getGoogleAuthUrl() {
    const state = crypto.randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      client_id: oauthConfig.google.clientId,
      redirect_uri: oauthConfig.google.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });
    return `${oauthConfig.google.authUrl}?${params.toString()}`;
  }

  async handleGoogleCallback(code, req, res) {
    try {
      const tokenResponse = await axios.post(oauthConfig.google.tokenUrl, {
        client_id: oauthConfig.google.clientId,
        client_secret: oauthConfig.google.clientSecret,
        code,
        redirect_uri: oauthConfig.google.redirectUri,
        grant_type: 'authorization_code',
      });

      const { access_token } = tokenResponse.data;

      const userInfoResponse = await axios.get(oauthConfig.google.userInfoUrl, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const profile = userInfoResponse.data;

      return await this._findOrCreateOauthUser(
        'google',
        profile.sub,
        {
          firstName: profile.given_name,
          lastName: profile.family_name,
          emailId: profile.email,
          photoUrl: profile.picture,
        },
        req,
        res
      );
    } catch {
      throw new InternalError('Failed to authenticate with Google');
    }
  }

  getGithubAuthUrl() {
    const params = new URLSearchParams({
      client_id: oauthConfig.github.clientId,
      redirect_uri: oauthConfig.github.redirectUri,
      scope: 'user:email read:user',
    });
    return `${oauthConfig.github.authUrl}?${params.toString()}`;
  }

  async handleGithubCallback(code, req, res) {
    try {
      const tokenResponse = await axios.post(
        oauthConfig.github.tokenUrl,
        {
          client_id: oauthConfig.github.clientId,
          client_secret: oauthConfig.github.clientSecret,
          code,
          redirect_uri: oauthConfig.github.redirectUri,
        },
        {
          headers: { Accept: 'application/json' },
        }
      );

      const { access_token } = tokenResponse.data;

      const userInfoResponse = await axios.get(oauthConfig.github.userUrl, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const profile = userInfoResponse.data;

      let emailId = profile.email;
      if (!emailId) {
        const emailsResponse = await axios.get(
          oauthConfig.github.userEmailsUrl,
          {
            headers: { Authorization: `Bearer ${access_token}` },
          }
        );
        const primaryEmail = emailsResponse.data.find((e) => e.primary);
        emailId = primaryEmail ? primaryEmail.email : null;
      }

      const nameParts = (profile.name || profile.login).split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      return await this._findOrCreateOauthUser(
        'github',
        profile.id.toString(),
        {
          firstName,
          lastName,
          emailId,
          photoUrl: profile.avatar_url,
        },
        req,
        res
      );
    } catch {
      throw new InternalError('Failed to authenticate with GitHub');
    }
  }

  async _findOrCreateOauthUser(provider, oauthId, profileData, req, res) {
    let user = await userRepository.findByOauthId(provider, oauthId);

    if (!user) {
      if (profileData.emailId) {
        const existingUser = await userRepository.findByEmail(
          profileData.emailId
        );
        if (existingUser) {
          if (!existingUser.oauthProvider) {
            existingUser.oauthProvider = provider;
            existingUser.oauthId = oauthId;
            await existingUser.save();
            user = existingUser;
          } else {
            throw new InternalError(
              `Email already used by ${existingUser.oauthProvider || 'password'} account`
            );
          }
        }
      }

      if (!user) {
        user = await userRepository.create({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          emailId:
            profileData.emailId || `${provider}_${oauthId}@example.com`,
          photoUrl: profileData.photoUrl,
          oauthProvider: provider,
          oauthId: oauthId,
        });

        await publishUserCreated(user);
      }
    }

    await sessionService.createSession(user, req, res);

    return user;
  }
}

export const oauthService = new OauthService();
export default oauthService;
