const express = require('express');
const router = express.Router();
const oauthController = require('../controllers/oauthController');

router.get('/google', oauthController.googleRedirect);
router.get('/google/callback', oauthController.googleCallback);

router.get('/github', oauthController.githubRedirect);
router.get('/github/callback', oauthController.githubCallback);

module.exports = router;
