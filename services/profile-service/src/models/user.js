const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName:      { type: String, required: true, minLength: 3, maxLength: 50 },
  lastName:       { type: String },
  emailId:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:       { type: String },
  age:            { type: Number, min: 18 },
  gender:         { type: String, enum: ['male', 'female', 'other'] },
  photoUrl:       { type: String, default: 'https://geographyandyou.com/images/user-profile.png' },
  about:          { type: String, default: 'This is a default about of the user!' },
  skills:         { type: [String], validate: v => v.length <= 10 },
  isPremium:      { type: Boolean, default: false },
  membershipType: { type: String },
  oauthProvider:  { type: String },
  oauthId:        { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
