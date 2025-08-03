const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  isAIResponse: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorType: {
    type: String,
    enum: ['gynecologist', 'general_practitioner'],
    required: true
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessage: {
    type: Date,
    default: Date.now
  },
  openaiConversationId: {
    type: String,
    default: null
  },
  systemPrompt: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

chatSchema.index({ userId: 1 });
chatSchema.index({ doctorType: 1 });
chatSchema.index({ lastMessage: -1 });
chatSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema); 