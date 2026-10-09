const razorpayInstance = require('../config/razorpay');
const paymentRepository = require('../repositories/paymentRepository');
const profileClient = require('./profileClient');
const { publishEvent, EVENTS, QUEUES, MEMBERSHIP_AMOUNT, BadRequestError } = require('@devtinder/shared');
const crypto = require('crypto');

class PaymentService {
  async createOrder(userId, membershipType, userDetails) {
    const amount = MEMBERSHIP_AMOUNT[membershipType];
    if (!amount) {
      throw new BadRequestError('Invalid membership type');
    }

    const receipt = `receipt_${Date.now()}`;
    
    const options = {
      amount: amount * 100, // paise
      currency: 'INR',
      receipt,
      notes: {
        firstName: userDetails.firstName || '',
        lastName: userDetails.lastName || '',
        membershipType
      }
    };

    const order = await razorpayInstance.orders.create(options);

    await paymentRepository.createPayment({
      userId,
      orderId: order.id,
      status: 'created',
      amount,
      currency: 'INR',
      receipt,
      notes: options.notes
    });

    return { order, keyId: process.env.RAZORPAY_KEY_ID };
  }

  async handleWebhook(body, signature) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
    const expectedSignature = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestError('Invalid signature');
    }

    if (body.event === 'payment.captured') {
      const paymentEntity = body.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const payment = await paymentRepository.updatePayment(paymentId, orderId, 'captured');
      
      if (payment) {
        await publishEvent(QUEUES.PAYMENT_EVENTS, EVENTS.PAYMENT_CAPTURED, {
          userId: payment.userId,
          membershipType: payment.notes.membershipType
        });
      }
    }
  }

  async verifyPremiumStatus(userId) {
    const profileResponse = await profileClient.getUserProfile(userId);
    const user = profileResponse.data;
    return {
      isPremium: user.isPremium || false,
      membershipType: user.membershipType || null
    };
  }
}

module.exports = new PaymentService();