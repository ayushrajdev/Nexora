import paymentService from './payment.service.js';
import { sendSuccess } from '../../core/responseFormatter.js';

export class PaymentController {
  constructor(service = paymentService) {
    this.service = service;
  }

  createOrder = async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { membershipType } = req.body;
      const userDetails = {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
      };

      const result = await this.service.createOrder(
        userId,
        membershipType,
        userDetails
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  webhook = async (req, res, next) => {
    try {
      const signature = req.headers['x-razorpay-signature'];
      await this.service.handleWebhook(req.body, signature);
      res.status(200).send('OK');
    } catch (err) {
      next(err);
    }
  };

  verifyPremium = async (req, res, next) => {
    try {
      const userId = req.user._id;
      const result = await this.service.verifyPremiumStatus(userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}

export const paymentController = new PaymentController();
export default paymentController;
