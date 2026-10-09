const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId:      { type: String, required: true, unique: true, index: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email:          { type: String, required: true },
  firstName:      { type: String },
  isPremium:      { type: Boolean, default: false },
  membershipType: { type: String },
  userAgent:      { type: String },
  ipAddress:      { type: String },
  isActive:       { type: Boolean, default: true },
  expiresAt:      { type: Date, required: true },
}, { timestamps: true });

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });  // TTL index
sessionSchema.index({ userId: 1 });

module.exports = mongoose.model('Session', sessionSchema);
