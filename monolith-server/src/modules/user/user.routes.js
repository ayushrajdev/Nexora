import express from 'express';
import userController from './user.controller.js';
import { sessionAuth } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/view', sessionAuth, userController.viewProfile);
router.patch('/edit', sessionAuth, userController.editProfile);
router.patch('/password', sessionAuth, userController.changePassword);
router.get('/feed', userController.getFeed);
router.get('/:userId', userController.getInternalProfile);

export default router;
