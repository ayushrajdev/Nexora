import axios from 'axios';
import crypto from 'crypto';
import env from '../../config/env.js';

/**
 * OAuth Strategy Pattern:
 * Defines a common interface for all OAuth 2.0 providers:
 * - getAuthUrl()
 * - getUserProfile(code)
 */

export class GoogleOAuthStrategy {
  constructor() {
    this.providerName = 'google';
    this.authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    this.tokenUrl = 'https://oauth2.googleapis.com/token';
    this.userInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
  }

  getAuthUrl() {
    const state = crypto.randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });
    return `${this.authUrl}?${params.toString()}`;
  }

  async getUserProfile(code) {
    const tokenResponse = await axios.post(this.tokenUrl, {
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenResponse.data;
    const userInfoResponse = await axios.get(this.userInfoUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = userInfoResponse.data;
    return {
      oauthId: profile.sub,
      firstName: profile.given_name || 'Developer',
      lastName: profile.family_name || '',
      emailId: profile.email,
      photoUrl: profile.picture,
    };
  }
}

export class GithubOAuthStrategy {
  constructor() {
    this.providerName = 'github';
    this.authUrl = 'https://github.com/login/oauth/authorize';
    this.tokenUrl = 'https://github.com/login/oauth/access_token';
    this.userUrl = 'https://api.github.com/user';
    this.userEmailsUrl = 'https://api.github.com/user/emails';
  }

  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_CALLBACK_URL,
      scope: 'user:email read:user',
    });
    return `${this.authUrl}?${params.toString()}`;
  }

  async getUserProfile(code) {
    const tokenResponse = await axios.post(
      this.tokenUrl,
      {
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_CALLBACK_URL,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token } = tokenResponse.data;
    const userInfoResponse = await axios.get(this.userUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = userInfoResponse.data;
    let emailId = profile.email;

    if (!emailId) {
      const emailsResponse = await axios.get(this.userEmailsUrl, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const primaryEmail = emailsResponse.data.find((e) => e.primary);
      emailId = primaryEmail ? primaryEmail.email : null;
    }

    const nameParts = (profile.name || profile.login || 'Developer').split(' ');
    return {
      oauthId: profile.id.toString(),
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
      emailId,
      photoUrl: profile.avatar_url,
    };
  }
}

/**
 * OAuthStrategyFactory — Factory Pattern for resolving OAuth provider strategies.
 */
export class OAuthStrategyFactory {
  static strategies = {
    google: new GoogleOAuthStrategy(),
    github: new GithubOAuthStrategy(),
  };

  static getStrategy(provider) {
    const strategy = this.strategies[provider];
    if (!strategy) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
    return strategy;
  }
}
