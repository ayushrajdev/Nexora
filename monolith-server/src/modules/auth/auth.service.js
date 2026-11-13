import bcrypt from 'bcrypt';
import userRepository from '../user/user.repository.js';
import sessionRepository from './session.repository.js';
import { OAuthStrategyFactory } from './oauth.strategy.js';
import {
  createSessionInStore,
  destroySessionFromStore,
} from '../../core/sessionStore.js';
import { COOKIE_NAME, DOMAIN_EVENTS } from '../../core/constants.js';
import { ErrorFactory } from '../../core/errors.js';
import domainEventBus from '../../core/eventBus.js';
import env from '../../config/env.js';

export class AuthService {
  constructor(
    users = userRepository,
    sessions = sessionRepository,
    eventBus = domainEventBus
  ) {
    this.users = users;
    this.sessions = sessions;
    this.eventBus = eventBus;
  }

  async createUserSession(user, req, res) {
    const sessionPayload = {
      userId: user._id.toString(),
      email: user.emailId,
      firstName: user.firstName,
      lastName: user.lastName || '',
      isPremium: Boolean(user.isPremium),
      membershipType: user.membershipType || null,
    };

    const { sessionId } = await createSessionInStore(sessionPayload);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.sessions.create({
      sessionId,
      userId: user._id,
      email: user.emailId,
      firstName: user.firstName,
      isPremium: user.isPremium,
      membershipType: user.membershipType,
      userAgent: req.get?.('user-agent'),
      ipAddress: req.ip,
      expiresAt,
    });

    res.cookie(COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  async destroyUserSession(req, res) {
    const sessionId = req.cookies?.[COOKIE_NAME] || req.cookies?.sid;
    if (sessionId) {
      await destroySessionFromStore(sessionId);
      await this.sessions.deactivate(sessionId);
    }
    res.clearCookie(COOKIE_NAME);
  }

  async signup(userData, req, res) {
    const {
      firstName,
      lastName,
      emailId,
      password,
      age,
      gender,
      photoUrl,
      about,
      skills,
    } = userData;

    const existingUser = await this.users.findByEmail(emailId);
    if (existingUser) {
      throw ErrorFactory.conflict('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.users.create({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
      age,
      gender,
      photoUrl,
      about,
      skills,
    });

    await this.createUserSession(user, req, res);

    await this.eventBus.publish(DOMAIN_EVENTS.USER_CREATED, {
      userId: user._id.toString(),
      emailId: user.emailId,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
    });

    const userObject = user.toObject ? user.toObject() : { ...user };
    delete userObject.password;
    return userObject;
  }

  async login({ emailId, password }, req, res) {
    const user = await this.users.findByEmail(emailId);
    if (!user) {
      throw ErrorFactory.notFound('User not found');
    }

    if (user.oauthProvider) {
      throw ErrorFactory.badRequest(
        `Please login with your ${user.oauthProvider} account`
      );
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw ErrorFactory.unauthorized('Invalid credentials');
    }

    await this.createUserSession(user, req, res);

    const userObject = user.toObject ? user.toObject() : { ...user };
    delete userObject.password;
    return userObject;
  }

  async logout(req, res) {
    await this.destroyUserSession(req, res);
  }

  getOAuthUrl(provider) {
    const strategy = OAuthStrategyFactory.getStrategy(provider);
    return strategy.getAuthUrl();
  }

  async handleOAuthCallback(provider, code, req, res) {
    try {
      const strategy = OAuthStrategyFactory.getStrategy(provider);
      const profileData = await strategy.getUserProfile(code);

      let user = await this.users.findByOauthId(provider, profileData.oauthId);
      if (!user) {
        if (profileData.emailId) {
          const existingUser = await this.users.findByEmail(
            profileData.emailId
          );
          if (existingUser) {
            if (!existingUser.oauthProvider) {
              existingUser.oauthProvider = provider;
              existingUser.oauthId = profileData.oauthId;
              if (existingUser.save) await existingUser.save();
              user = existingUser;
            } else {
              throw ErrorFactory.internal(
                `Email already used by ${existingUser.oauthProvider} account`
              );
            }
          }
        }

        if (!user) {
          user = await this.users.create({
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            emailId:
              profileData.emailId ||
              `${provider}_${profileData.oauthId}@example.com`,
            photoUrl: profileData.photoUrl,
            oauthProvider: provider,
            oauthId: profileData.oauthId,
          });

          await this.eventBus.publish(DOMAIN_EVENTS.USER_CREATED, {
            userId: user._id.toString(),
            emailId: user.emailId,
            firstName: user.firstName,
            lastName: user.lastName,
            photoUrl: user.photoUrl,
          });
        }
      }

      await this.createUserSession(user, req, res);
      return user;
    } catch {
      throw ErrorFactory.internal(`Failed to authenticate with ${provider}`);
    }
  }
}

export const authService = new AuthService();
export default authService;
