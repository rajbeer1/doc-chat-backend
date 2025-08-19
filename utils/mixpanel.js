const Mixpanel = require('mixpanel');

const mixpanelClient = Mixpanel.init(process.env.MIXPANEL_TOKEN , {
  host: 'https://api-eu.mixpanel.com'
});
const sendChatData = (userId, phoneNumber, userMessage, aiResponse, doctorType) => {
  try {
    const eventData = {
      distinct_id: userId,
      user_message: userMessage,
      ai_response: aiResponse,
      doctor_type: doctorType,
      timestamp: new Date().toISOString()
    };
    if (phoneNumber) {
      eventData.phone_number = phoneNumber;
    }
   mixpanelClient.track('Chat Data', eventData);
  } catch (error) {
    console.error('Mixpanel tracking error:', error);
  }
};
module.exports = {
  sendChatData
};
