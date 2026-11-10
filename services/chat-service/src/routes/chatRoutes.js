import express from 'express';
import chatController from '../controllers/chatController.js';
import { internalAuth } from '@devtinder/shared';

const router = express.Router();

router.get('/:targetUserId', internalAuth, (req, res, next) =>
  chatController.getChat(req, res, next)
);

export default router;
