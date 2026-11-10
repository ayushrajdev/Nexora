import express from 'express';
import profileController from '../controllers/profileController.js';
import { internalAuth } from '@devtinder/shared';
import verifyInternalService from '../middlewares/internalService.js';

const router = express.Router();

router.get('/profile/view', internalAuth, (req, res, next) =>
  profileController.viewProfile(req, res, next)
);
router.patch('/profile/edit', internalAuth, (req, res, next) =>
  profileController.editProfile(req, res, next)
);
router.patch('/profile/password', internalAuth, (req, res, next) =>
  profileController.changePassword(req, res, next)
);

router.get('/profile/feed', verifyInternalService, (req, res, next) =>
  profileController.getFeed(req, res, next)
);
router.get('/profile/:userId', verifyInternalService, (req, res, next) =>
  profileController.getInternalProfile(req, res, next)
);

export default router;
