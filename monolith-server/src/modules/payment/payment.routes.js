import express from 'express';
import paymentController from './payment.controller.js';
import { sessionAuth } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/create', sessionAuth, paymentController.createOrder);
router.post('/webhook', paymentController.webhook);
router.get('/premium/verify', sessionAuth, paymentController.verifyPremium);

export default router;
