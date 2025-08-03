const twilio = require('twilio');

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function getMessageBody(otp) {
  return `Your verification code is: ${otp}. Don't share this code with anyone; our employees will never ask for the code.`;
}

async function sendOTP(formattedPhoneNumber, otp) {
  try {
    console.log(`(${formattedPhoneNumber}) ` + getMessageBody(otp));

    await twilioClient.messages.create({
      to: formattedPhoneNumber,
      forceDelivery: true,
      messagingServiceSid:
        process.env.TWILIO_MESSAGING_SERVICE_SID ||
        'MG031243d9eeffbfd741030c874a859840',
      from: process.env.TWILIO_MESSAGING_FROM || '+16166121952',
      body: getMessageBody(otp),
    });

    return true;
  } catch (error) {
    console.error('Twilio sendOTP error:', error);
    return false;
  }
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
  sendOTP,
  generateOTP,
  getMessageBody
}; 