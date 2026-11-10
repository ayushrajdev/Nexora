import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from 'http';
import { fileURLToPath } from 'url';
import {
  logger,
  getSession,
  refreshSession,
  COOKIE_NAME,
} from '@devtinder/shared';

import services from './config/services.js';
import routes from './routes/index.js';
import sanitizeHeaders from './middlewares/sanitizeHeaders.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import errorHandler from './middlewares/errorHandler.js';
import { createServiceProxy } from './proxy/proxyMiddleware.js';

export const app = express();

app.use(
  cors({
    origin: services.FRONT_END_URL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(sanitizeHeaders);
app.use(globalLimiter);

// Note: We do NOT use express.json() here globally because we want to proxy raw requests.
// body-parsing breaks http-proxy-middleware in some cases for POST requests.

// Health check
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// Mount routes
app.use('/', routes);

// WebSocket proxy for chat service
const chatWsProxy = createServiceProxy(services.CHAT_SERVICE_URL);

// Error handling
app.use(errorHandler);

export const startServer = () => {
  const server = http.createServer(app);

  // Upgrade requests for websockets
  server.on('upgrade', async (req, socket, head) => {
    try {
      if (req.url.startsWith('/socket.io/')) {
        const cookies = req.headers.cookie;
        let sid = null;
        if (cookies) {
          const parsedCookies = cookies.split(';').reduce((res, c) => {
            const [key, val] = c.trim().split('=').map(decodeURIComponent);
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

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer();
}
