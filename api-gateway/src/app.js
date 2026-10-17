require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const {
    logger,
    getSession,
    refreshSession,
    COOKIE_NAME,
} = require('@devtinder/shared');

const services = require('./config/services');
const routes = require('./routes');
const sanitizeHeaders = require('./middlewares/sanitizeHeaders');
const { globalLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');
const { createServiceProxy } = require('./proxy/proxyMiddleware');

const app = express();

app.use(
    cors({
        origin: services.FRONT_END_URL,
        credentials: true,
    }),
);

app.use(cookieParser());
app.use(sanitizeHeaders);
app.use(globalLimiter);

// Note: We do NOT use express.json() here globally because we want to proxy raw requests.
// body-parsing breaks http-proxy-middleware in some cases for POST requests.

// Mount routes
app.use('/', routes);

// WebSocket proxy for chat service
const chatWsProxy = createServiceProxy(services.CHAT_SERVICE_URL);

// Error handling
app.use(errorHandler);

const startServer = () => {
    const server = http.createServer(app);

    // Upgrade requests for websockets
    server.on('upgrade', async (req, socket, head) => {
        try {
            if (req.url.startsWith('/socket.io/')) {
                const cookies = req.headers.cookie;
                let sid = null;
                if (cookies) {
                    const parsedCookies = cookies
                        .split(';')
                        .reduce((res, c) => {
                            const [key, val] = c
                                .trim()
                                .split('=')
                                .map(decodeURIComponent);
                            res[key] = val;
                            return res;
                        }, {});

                    sid = parsedCookies[COOKIE_NAME] || parsedCookies['sid'];
                }

                if (sid) {
                    const session = await getSession(sid);
                    if (session) {
                        req.headers['x-user-id'] = session.userId;
                        req.headers['x-user-email'] = session.email;
                        req.headers['x-user-name'] = session.firstName;
                        req.headers['x-user-premium'] = session.isPremium
                            ? 'true'
                            : 'false';
                        req.headers['x-user-membership'] =
                            session.membershipType || 'free';

                        await refreshSession(sid);
                    }
                }
                chatWsProxy.upgrade(req, socket, head);
            } else {
                socket.destroy();
            }
        } catch (err) {
            logger.error('WebSocket upgrade error', err);
            socket.destroy();
        }
    });

    const PORT = services.PORT;
    server.listen(PORT, () => {
        logger.info(`API Gateway listening on port ${PORT}`);
    });

    return server;
};

// If run directly
if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
