const express = require('express');
const paymentController = require('../controllers/paymentController');
const { internalAuth } = require('@devtinder/shared');

const router = express.Router();

router.post('/create', internalAuth, paymentController.createOrder);
router.post('/webhook', paymentController.webhook);
router.get('/premium/verify', internalAuth, paymentController.verifyPremium);

module.exports = router;