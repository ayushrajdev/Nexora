import BaseRepository from '../../core/baseRepository.js';
import Payment from './payment.model.js';

export class PaymentRepository extends BaseRepository {
  constructor(model = Payment) {
    super(model);
  }

  async createPayment(paymentData) {
    return this.model.create(paymentData);
  }

  async findByOrderId(orderId) {
    return this.model.findOne({ orderId });
  }

  async updatePayment(paymentIdStr, orderId, status) {
    return this.model.findOneAndUpdate(
      { orderId },
      { paymentId: paymentIdStr, status },
      { new: true }
    );
  }
}

export const paymentRepository = new PaymentRepository();
export default paymentRepository;
