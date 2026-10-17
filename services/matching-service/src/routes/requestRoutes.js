const express = require('express');
const requestController = require('../controllers/requestController');
const { internalAuth } = require('@devtinder/shared');

const router = express.Router();

router.post(
    '/send/:status/:toUserId',
    internalAuth,
    requestController.sendRequest.bind(requestController),
);
router.post(
    '/review/:status/:requestId',
    internalAuth,
    requestController.reviewRequest.bind(requestController),
);

module.exports = router;
