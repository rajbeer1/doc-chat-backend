const Chat = require("../models/Chat");
const User = require("../models/User");
const {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
} = require("../utils/jwt");
const { generateResponse, SYSTEM_PROMPTS } = require("../utils/openai");
const { sendOTP, generateOTP } = require("../utils/twilio");
const { setOTP, getOTP, deleteOTP } = require("../utils/redis");
const { v4: uuidv4 } = require("uuid");

const sendMessage = async (req, res) => {
  try {
    const { message, doctorType } = req.body;

    if (
      !message ||
      !doctorType ||
      !["gynecologist", "general_practitioner"].includes(doctorType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Message and valid doctor type (gynecologist or general_practitioner) are required",
      });
    }

    let user = null;
    let isNewUser = false;

    const token = extractTokenFromHeader(req);
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        user = await User.findById(decoded.id);
      }
    }

    if (!user) {
      const username = `user_${uuidv4().substring(0, 8)}`;
      user = await User.create({
        username,
        userType: "anonymous",
        chatCount: 0,
        maxChats: 5,
      });
      isNewUser = true;
    }

    if (user.userType === "anonymous" && user.chatCount >= user.maxChats) {
      return res.status(403).json({
        success: false,
        message: "Phone verification required to continue chatting",
        requiresPhone: true,
        currentChats: user.chatCount,
        maxChats: user.maxChats,
      });
    }

    let chat = await Chat.findOne({
      userId: user._id,
      doctorType,
      isActive: true,
    });

    if (!chat) {
      chat = await Chat.create({
        title: `Chat with ${doctorType.replace("_", " ")}`,
        userId: user._id,
        doctorType,
        systemPrompt: SYSTEM_PROMPTS[doctorType],
        messages: [
          {
            sender: user._id,
            content: "जी कैसे हो आप? मुझे बताइए क्या दिक्कत आपको?",
            isAIResponse: true,
          },
        ],
        isActive: true,
      });
    }

    const userMessage = {
      sender: user._id,
      content: message,
      isAIResponse: false,
    };

    chat.messages.push(userMessage);

    try {
      const aiResponse = await generateResponse(
        chat.messages,
        chat.doctorType,
        chat.openaiConversationId
      );

      const aiMessage = {
        sender: user._id,
        content: aiResponse.content,
        isAIResponse: true,
      };

      chat.messages.push(aiMessage);
      chat.openaiConversationId = aiResponse.conversationId;
    } catch (aiError) {
      console.error("AI response error:", aiError);
      const errorMessage = {
        sender: user._id,
        content:
          "Sorry, I am having trouble responding right now. Please try again later.",
        isAIResponse: true,
      };
      chat.messages.push(errorMessage);
    }

    chat.lastMessage = new Date();

    await chat.save();
    user.chatCount += 1;
    await user.save();
    const jwtToken = generateToken(user._id, user.userType);

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");
    if (isNewUser) {
      res.write(`TOKEN:${jwtToken}\n`);
    }
    const aiMessage = chat.messages
      .filter((msg) => msg.isAIResponse && msg.content)
      .pop();
    if (aiMessage) {
      res.write(aiMessage.content);
    }

    res.end();
  } catch (error) {
    console.error("Send message error:", error);
    res.setHeader("Content-Type", "text/plain");
    res.status(500);
    res.write(
      "Sorry, I am having trouble responding right now. Please try again later."
    );
    res.end();
  }
};

const getChats = async (req, res) => {
  try {
    const { doctorType } = req.params;
    const token = extractTokenFromHeader(req);

    if (!token) {
      const defaultChat = {
        _id: "default_chat",
        title: `Chat with ${doctorType.replace("_", " ")}`,
        userId: uuidv4(),
        doctorType: doctorType,
        messages: [
          {
            sender: uuidv4(),
            content: "जी कैसे हो आप? मुझे बताइए क्या दिक्कत आपको?",
            isAIResponse: true,
            createdAt: new Date(),
          },
        ],
        lastMessage: new Date(),
        createdAt: new Date(),
        isActive: true,
      };
      return res.status(200).json([defaultChat]);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const chats = await Chat.find({
      userId: user._id,
      doctorType,
      isActive: true,
    }).sort({ lastMessage: -1 });

    if (chats.length === 0) {
      const defaultChat = {
        _id: "default_chat",
        title: `Chat with ${doctorType.replace("_", " ")}`,
        userId: uuidv4(),
        doctorType: doctorType,
        messages: [
          {
            sender: uuidv4(),
            content: "जी कैसे हो आप? मुझे बताइए क्या दिक्कत आपको?",
            isAIResponse: true,
            createdAt: new Date(),
          },
        ],
        lastMessage: new Date(),
        createdAt: new Date(),
        isActive: true,
      };
      return res.status(200).json([defaultChat]);
    }

    res.status(200).json(chats);
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const sendOTPToPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const token = extractTokenFromHeader(req);

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    let user = null;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        user = await User.findById(decoded.id);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Valid token required",
      });
    }
    const formattedPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+91${phoneNumber}`;
    const existingUser = await User.findOne({ phoneNumber: formattedPhone });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered with another account",
      });
    }

    const otp = generateOTP();

    const otpSent = await sendOTP(formattedPhone, otp);
    if (!otpSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
      });
    }
    await setOTP(formattedPhone, otp);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const token = extractTokenFromHeader(req);

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }
    const formattedPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+91${phoneNumber}`;
    let user = null;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        user = await User.findById(decoded.id);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Valid token required",
      });
    }

    // Verify OTP
    const storedOTP = await getOTP(formattedPhone);
    if (!storedOTP || storedOTP.toString() !== otp.toString()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.phoneNumber = formattedPhone;
    user.isPhoneVerified = true;
    user.userType = "verified";
    user.maxChats = 50;
    await user.save();

    await deleteOTP(formattedPhone);

    const newToken = generateToken(user._id, user.userType);

    res.status(200).json({
      success: true,
      message: "Phone number verified successfully",
      token: newToken,
      user: {
        id: user._id,
        username: user.username,
        userType: user.userType,
        chatCount: user.chatCount,
        maxChats: user.maxChats,
        phoneNumber: user.phoneNumber,
        isPhoneVerified: user.isPhoneVerified,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getChats,
  sendOTPToPhone,
  verifyOTP,
};
