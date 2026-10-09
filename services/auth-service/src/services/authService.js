const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const sessionService = require('./sessionService');
const { publishUserCreated } = require('../events/publisher');
const { BadRequestError, NotFoundError, UnauthorizedError, ConflictError } = require('@devtinder/shared');

class AuthService {
  async signup(userData, req, res) {
    const { firstName, lastName, emailId, password, age, gender, photoUrl, about, skills } = userData;

    // Check if user exists
    const existingUser = await userRepository.findByEmail(emailId);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await userRepository.create({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
      age,
      gender,
      photoUrl,
      about,
      skills
    });

    // Create session
    await sessionService.createSession(user, req, res);

    // Publish event
    await publishUserCreated(user);

    // Return user data (omit password)
    const userObject = user.toObject();
    delete userObject.password;
    
    return userObject;
  }

  async login({ emailId, password }, req, res) {
    // Find user
    const user = await userRepository.findByEmail(emailId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if OAuth user
    if (user.oauthProvider) {
      throw new BadRequestError(`Please login with your ${user.oauthProvider} account`);
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Create session
    await sessionService.createSession(user, req, res);

    // Return user data (omit password)
    const userObject = user.toObject();
    delete userObject.password;
    
    return userObject;
  }

  async logout(req, res) {
    await sessionService.destroySession(req, res);
  }
}

module.exports = new AuthService();
