import mongoose from 'mongoose';

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      required: true,
      enum: ['ignored', 'interested', 'accepted', 'rejected'],
    },
  },
  { timestamps: true }
);

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });

connectionRequestSchema.pre('save', function (next) {
  if (this.fromUserId.toString() === this.toUserId.toString()) {
    throw new Error('Cannot send connection request to yourself!');
  }
  next();
});

export const ConnectionRequest =
  mongoose.models.ConnectionRequest ||
  mongoose.model('ConnectionRequest', connectionRequestSchema);
export default ConnectionRequest;
