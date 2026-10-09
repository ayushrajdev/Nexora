const {
    createSession: createRedisSession,
    destroySession: destroyRedisSession,
    COOKIE_NAME,
} = require('@devtinder/shared');
const sessionRepository = require('../repositories/sessionRepository');
const crypto = require('crypto');

class SessionService {
    async createSession(user, req, res) {
        // Generate a unique session ID
        // const sessionId = crypto.randomUUID();

        // // 1. Create session in Redis
        // const sessionData = {
        //     userId: user._id.toString(),
        //     email: user.emailId,
        //     firstName: user.firstName,
        //     isPremium: user.isPremium,
        //     membershipType: user.membershipType,
        // };

        // Save to Redis (createRedisSession generates and returns sessionId)
        const { sessionId ,sessionData} = await createRedisSession(sessionData);

        // 2. Create session in MongoDB
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await sessionRepository.create({
            sessionId,
            userId: user._id,
            email: user.emailId,
            firstName: user.firstName,
            isPremium: user.isPremium,
            membershipType: user.membershipType,
            userAgent: req.get('user-agent'),
            ipAddress: req.ip,
            expiresAt,
        });

        // 3. Set cookie
        res.cookie(COOKIE_NAME || 'sid', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
    }

    async destroySession(req, res) {
        const sessionId = req.cookies[COOKIE_NAME || 'sid'];

        if (sessionId) {
            // 1. Destroy session from Redis
            await destroyRedisSession(sessionId);

            // 2. Mark inactive in MongoDB
            await sessionRepository.deactivate(sessionId);
        }

        // 3. Clear cookie
        res.clearCookie(COOKIE_NAME || 'sid');
    }
}

module.exports = new SessionService();
