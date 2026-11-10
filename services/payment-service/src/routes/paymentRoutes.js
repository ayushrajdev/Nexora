import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { internalAuth } from '@devtinder/shared';

const router = express.Router();

router.post('/create', internalAuth, (req, res, next) =>
  paymentController.createOrder(req, res, next)
);
router.post('/webhook', (req, res, next) =>
  paymentController.webhook(req, res, next)
);
router.get('/premium/verify', internalAuth, (req, res, next) =>
  paymentController.verifyPremium(req, res, next)
);

export default router;
