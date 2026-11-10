import express from 'express';
import userController from '../controllers/userController.js';
import { internalAuth } from '@devtinder/shared';
import verifyInternalService from '../middlewares/internalService.js';

const router = express.Router();

router.get('/requests/received', internalAuth, (req, res, next) =>
  userController.getReceivedRequests(req, res, next)
);
router.get('/connections', internalAuth, (req, res, next) =>
  userController.getConnections(req, res, next)
);
router.get('/feed', internalAuth, (req, res, next) =>
  userController.getFeed(req, res, next)
);

router.get(
  '/connections/verify/:userId',
  verifyInternalService,
  (req, res, next) => userController.verifyConnection(req, res, next)
);

export default router;
