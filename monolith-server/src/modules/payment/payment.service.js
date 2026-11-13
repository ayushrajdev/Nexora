import crypto from 'crypto';
import Razorpay from 'razorpay';
import paymentRepository from './payment.repository.js';
import { MembershipPlanStrategyFactory } from './payment.strategy.js';
import userService from '../user/user.service.js';
import domainEventBus from '../../core/eventBus.js';
import { DOMAIN_EVENTS } from '../../core/constants.js';
import { ErrorFactory } from '../../core/errors.js';
import env from '../../config/env.js';

export const razorpayInstance = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export class PaymentService {
  constructor(
    repo = paymentRepository,
    profiles = userService,
    eventBus = domainEventBus,
    gateway = razorpayInstance
  ) {
    this.repo = repo;
    this.profiles = profiles;
    this.eventBus = eventBus;
    this.gateway = gateway;
  }

  async createOrder(userId, membershipType, userDetails) {
    const strategy = MembershipPlanStrategyFactory.getStrategy(membershipType);
    const options = strategy.buildOrderOptions(userDetails);

    const order = await this.gateway.orders.create(options);

    await this.repo.createPayment({
      userId,
      orderId: order.id,
      status: 'created',
      amount: strategy.amountInr,
      currency: 'INR',
      receipt: options.receipt,
      notes: options.notes,
    });

    return { order, keyId: env.RAZORPAY_KEY_ID };
  }

  async handleWebhook(body, signature) {
    const secret = env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw ErrorFactory.badRequest('Invalid signature');
    }

    if (body.event === 'payment.captured') {
      const paymentEntity = body.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const payment = await this.repo.updatePayment(
        paymentId,
        orderId,
        'captured'
      );

      if (payment) {
        await this.eventBus.publish(DOMAIN_EVENTS.PAYMENT_CAPTURED, {
          userId: payment.userId,
          membershipType: payment.notes?.membershipType,
        });
      }
    }
  }

  async verifyPremiumStatus(userId) {
    const user = await this.profiles.getProfile(userId);
    return {
      isPremium: Boolean(user.isPremium),
      membershipType: user.membershipType || null,
    };
  }
}

export const paymentService = new PaymentService();
export default paymentService;
