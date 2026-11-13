import express from 'express';
import chatController from './chat.controller.js';
import { sessionAuth } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/:targetUserId', sessionAuth, chatController.getChat);

export default router;
