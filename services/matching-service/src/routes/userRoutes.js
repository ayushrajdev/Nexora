const express = require('express');
const userController = require('../controllers/userController');
const { internalAuth } = require('@devtinder/shared');
const verifyInternalService = require('../middlewares/internalService');

const router = express.Router();

router.get('/requests/received', internalAuth, userController.getReceivedRequests.bind(userController));
router.get('/connections', internalAuth, userController.getConnections.bind(userController));
router.get('/feed', internalAuth, userController.getFeed.bind(userController));

router.get('/connections/verify/:userId', verifyInternalService, userController.verifyConnection.bind(userController));

module.exports = router;