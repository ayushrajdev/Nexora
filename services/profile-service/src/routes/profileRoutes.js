const express = require('express');
const profileController = require('../controllers/profileController');
const { internalAuth } = require('@devtinder/shared');
const verifyInternalService = require('../middlewares/internalService');

const router = express.Router();

router.get('/profile/view', internalAuth, profileController.viewProfile.bind(profileController));
router.patch('/profile/edit', internalAuth, profileController.editProfile.bind(profileController));
router.patch('/profile/password', internalAuth, profileController.changePassword.bind(profileController));

router.get('/profile/feed', verifyInternalService, profileController.getFeed.bind(profileController));
router.get('/profile/:userId', verifyInternalService, profileController.getInternalProfile.bind(profileController));

module.exports = router;
