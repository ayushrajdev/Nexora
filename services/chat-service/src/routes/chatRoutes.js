const express = require('express');
const chatController = require('../controllers/chatController');
const { internalAuth } = require('@devtinder/shared');

const router = express.Router();

router.get('/:targetUserId', internalAuth, chatController.getChat);

module.exports = router;