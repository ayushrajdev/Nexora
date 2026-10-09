const Payment = require('../models/payment');

class PaymentRepository {
  async createPayment(paymentData) {
    return await Payment.create(paymentData);
  }

  async findByOrderId(orderId) {
    return await Payment.findOne({ orderId });
  }

  async updatePayment(paymentIdStr, orderId, status) {
    return await Payment.findOneAndUpdate(
      { orderId },
      { paymentId: paymentIdStr, status },
      { new: true }
    );
  }
}

module.exports = new PaymentRepository();