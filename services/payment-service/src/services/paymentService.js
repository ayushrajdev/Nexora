import crypto from 'crypto';
import razorpayInstance from '../config/razorpay.js';
import paymentRepository from '../repositories/paymentRepository.js';
import profileClient from './profileClient.js';
import {
  createPublisher,
  publishEvent,
  EVENTS,
  QUEUES,
  MEMBERSHIP_AMOUNT,
  BadRequestError,
} from '@devtinder/shared';

let paymentPublisher = null;

const getPaymentPublisher = () => {
  if (!paymentPublisher) {
    paymentPublisher = createPublisher(QUEUES.PAYMENT_EVENTS);
  }
  return paymentPublisher;
};

export const setPaymentPublisher = (customPublisher) => {
  paymentPublisher = customPublisher;
};

export class PaymentService {
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
        membershipType,
      },
    };

    const order = await razorpayInstance.orders.create(options);

    await paymentRepository.createPayment({
      userId,
      orderId: order.id,
      status: 'created',
      amount,
      currency: 'INR',
      receipt,
      notes: options.notes,
    });

    return { order, keyId: process.env.RAZORPAY_KEY_ID };
  }

  async handleWebhook(body, signature) {
    const secret =
      process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestError('Invalid signature');
    }

    if (body.event === 'payment.captured') {
      const paymentEntity = body.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const payment = await paymentRepository.updatePayment(
        paymentId,
        orderId,
        'captured'
      );

      if (payment) {
        await publishEvent(getPaymentPublisher(), EVENTS.PAYMENT_CAPTURED, {
          userId: payment.userId,
          membershipType: payment.notes.membershipType,
        });
      }
    }
  }

  async verifyPremiumStatus(userId) {
    const profileResponse = await profileClient.getUserProfile(userId);
    const user = profileResponse.data || profileResponse;
    return {
      isPremium: user.isPremium || false,
      membershipType: user.membershipType || null,
    };
  }
}

export const paymentService = new PaymentService();
export default paymentService;
