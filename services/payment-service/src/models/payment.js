import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, required: true },
    paymentId: { type: String },
    orderId:   { type: String, required: true },
    status:    { type: String, required: true },
    amount:    { type: Number, required: true },
    currency:  { type: String, required: true },
    receipt:   { type: String, required: true },
    notes: {
      firstName:      String,
      lastName:       String,
      membershipType: String,
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
