const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 30
  },
  phoneNumber: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: 50,
    default: 'Anonymous'
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50,
    default: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userType: {
    type: String,
    enum: ['anonymous', 'verified'],
    default: 'anonymous'
  },
  chatCount: {
    type: Number,
    default: 0
  },
  maxChats: {
    type: Number,
    default: 5
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.index({ username: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ userType: 1 });

module.exports = mongoose.model('User', userSchema); 