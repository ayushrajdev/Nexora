const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName:      { type: String, required: true, minLength: 3, maxLength: 50 },
  lastName:       { type: String },
  emailId:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:       { type: String },  // NOT required — null for OAuth users
  age:            { type: Number, min: 18 },
  gender:         { type: String, enum: ['male', 'female', 'other'] },
  photoUrl:       { type: String, default: 'https://geographyandyou.com/images/user-profile.png' },
  about:          { type: String, default: 'This is a default about of the user!' },
  skills:         { type: [String], validate: v => v.length <= 10 },
  isPremium:      { type: Boolean, default: false },
  membershipType: { type: String },
  oauthProvider:  { type: String, enum: ['google', 'github', null], default: null },
  oauthId:        { type: String },
}, { timestamps: true });

userSchema.index({ emailId: 1 }, { unique: true });
userSchema.index({ oauthProvider: 1, oauthId: 1 });

userSchema.methods.validatePassword = async function (inputPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
