import express from 'express';
import matchingController from './matching.controller.js';
import { sessionAuth } from '../../middlewares/auth.middleware.js';

export const requestRouter = express.Router();
requestRouter.post(
  '/send/:status/:toUserId',
  sessionAuth,
  matchingController.sendRequest
);
requestRouter.post(
  '/review/:status/:requestId',
  sessionAuth,
  matchingController.reviewRequest
);

export const userMatchingRouter = express.Router();
userMatchingRouter.get(
  '/requests/received',
  sessionAuth,
  matchingController.getReceivedRequests
);
userMatchingRouter.get(
  '/connections',
  sessionAuth,
  matchingController.getConnections
);
userMatchingRouter.get('/feed', sessionAuth, matchingController.getFeed);
userMatchingRouter.get(
  '/connections/verify/:userId',
  sessionAuth,
  matchingController.verifyConnection
);
