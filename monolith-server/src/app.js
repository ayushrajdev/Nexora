import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import env from './config/env.js';
import { sanitizeHeaders } from './middlewares/auth.middleware.js';
import { globalLimiter } from './middlewares/rateLimit.middleware.js';
import errorHandler from './middlewares/error.middleware.js';

import { authRoutes } from './modules/auth/index.js';
import { userRoutes, userService } from './modules/user/index.js';
import { requestRouter, userMatchingRouter } from './modules/matching/index.js';
import { chatRoutes } from './modules/chat/index.js';
import { paymentRoutes } from './modules/payment/index.js';
import { notificationService } from './modules/notification/index.js';
import domainEventBus from './core/eventBus.js';

// Wire up Observer Pattern domain event listeners across modules
export const initializeDomainEventSubscribers = () => {
  domainEventBus.clear();
  userService.registerDomainEvents();
  notificationService.registerDomainEvents();
};

initializeDomainEventSubscribers();

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.FRONT_END_URL,
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use(sanitizeHeaders);
  app.use(globalLimiter);
  app.use(express.json());

  // Health Check
  app.get('/health', (_req, res) =>
    res.status(200).json({
      status: 'ok',
      architecture: 'modular-monolith',
      port: env.PORT,
    })
  );

  // Mount Domain Modules (matching exact API Gateway routes for seamless frontend integration)
  app.use('/auth', authRoutes);
  app.use('/profile', userRoutes);
  app.use('/request', requestRouter);
  app.use('/user', userMatchingRouter);
  app.use('/chat', chatRoutes);
  app.use('/payment', paymentRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;
