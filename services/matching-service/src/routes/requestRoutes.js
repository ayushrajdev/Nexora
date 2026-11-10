import express from 'express';
import requestController from '../controllers/requestController.js';
import { internalAuth } from '@devtinder/shared';

const router = express.Router();

router.post('/send/:status/:toUserId', internalAuth, (req, res, next) =>
  requestController.sendRequest(req, res, next)
);
router.post('/review/:status/:requestId', internalAuth, (req, res, next) =>
  requestController.reviewRequest(req, res, next)
);

export default router;
