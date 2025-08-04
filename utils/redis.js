if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = require('node-fetch');
}

const { Redis } = require("@upstash/redis");
const client = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const setOTP = async (phoneNumber, otp) => {
  try {
    await client.set(`otp:${phoneNumber}`, otp); // 5 minutes expiry
    return true;
  } catch (error) {
    console.error('Redis setOTP error:', error);
    return false;
  }
};

const getOTP = async (phoneNumber) => {
  try {
    const otp = await client.get(`otp:${phoneNumber}`);
    return otp;
  } catch (error) {
    console.error('Redis getOTP error:', error);
    return null;
  }
};

const deleteOTP = async (phoneNumber) => {
  try {
    await client.del(`otp:${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('Redis deleteOTP error:', error);
    return false;
  }
};

module.exports = {
  setOTP,
  getOTP,
  deleteOTP
}; 