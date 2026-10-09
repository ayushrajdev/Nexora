const paymentService = require('../services/paymentService');
const { sendSuccess } = require('@devtinder/shared');

class PaymentController {
  async createOrder(req, res, next) {
    try {
      const userId = req.user._id;
      const { membershipType } = req.body;
      const userDetails = { firstName: req.user.firstName, lastName: req.user.lastName };
      
      const result = await paymentService.createOrder(userId, membershipType, userDetails);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async webhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      await paymentService.handleWebhook(req.body, signature);
      res.status(200).send('OK');
    } catch (error) {
      next(error);
    }
  }

  async verifyPremium(req, res, next) {
    try {
      const userId = req.user._id;
      const result = await paymentService.verifyPremiumStatus(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();