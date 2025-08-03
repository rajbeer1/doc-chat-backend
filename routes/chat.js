const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getChats,
  sendOTPToPhone,
  verifyOTP
} = require('../controllers/chatController');

// Chat routes
router.route('/send')
  .post(sendMessage);

router.route('/send-otp')
  .post(sendOTPToPhone);

router.route('/verify-otp')
  .post(verifyOTP);

router.route('/:doctorType')
  .get(getChats);

module.exports = router; 