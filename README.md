# AI Chat Backend - Frontend Integration Guide

A Node.js backend API for AI-powered medical consultations with automatic user creation, chat limits, and phone verification.

## 🚀 Quick Start

**Base URL:** `http://localhost:3001/api/chat`

## 📋 API Endpoints

### 1. Send Message (Main Chat Endpoint)
**POST** `/send`

**Description:** Send a message to AI doctor. Creates anonymous user if no JWT token provided.

**Request Body:**
```json
{
  "message": "Hello doctor, I have a question about...",
  "doctorType": "gynecologist" | "general_practitioner"
}
```

**Response Format:**
```
Content-Type: text/plain
Transfer-Encoding: chunked

[For New Users]
TOKEN:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
[AI Response Text]

[For Existing Users]
[AI Response Text]
```

**Example Response:**
```
TOKEN:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjhiOGI4YjhiOGI4YjhiOGI4YjhiOGI4YjgiLCJ1c2VyVHlwZSI6ImFub255bW91cyIsImlhdCI6MTczNDU2Nzg5MCwiZXhwIjoxNzM3MTU5ODkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8
Hello! Main aapki kya help kar sakti hoon? Aap apne health ke baare mein bata sakte hain.
```

### 2. Get User Chats
**GET** `/:doctorType`

**Description:** Get all chats for a specific doctor type.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
[
  {
    "_id": "chat_id",
    "title": "Chat with gynecologist",
    "userId": "user_id",
    "doctorType": "gynecologist",
    "messages": [
      {
        "sender": "user_id",
        "content": "Hello doctor",
        "isAIResponse": false,
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "sender": "user_id",
        "content": "Hello! How can I help?",
        "isAIResponse": true,
        "createdAt": "2024-01-15T10:30:05.000Z"
      }
    ],
    "lastMessage": "2024-01-15T10:30:05.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### 3. Send OTP
**POST** `/send-otp`

**Description:** Send OTP to phone number for verification.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### 4. Verify OTP
**POST** `/verify-otp`

**Description:** Verify OTP and upgrade user to verified status.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "token": "new_jwt_token",
  "user": {
    "id": "user_id",
    "username": "user_abc123",
    "userType": "verified",
    "chatCount": 5,
    "maxChats": 50,
    "phoneNumber": "+1234567890",
    "isPhoneVerified": true
  }
}
```

## 🔄 User Flow

### 1. Anonymous User Flow
```
1. User sends first message → Creates anonymous user
2. Response includes JWT token → Store token locally
3. Continue chatting (up to 5 chats)
4. After 5 chats → Phone verification required
```

### 2. Phone Verification Flow
```
1. User hits 5 chat limit
2. Send OTP to phone number
3. Verify OTP
4. User upgraded to verified status
5. Chat limit increased to 50
6. New JWT token provided
```

### 3. Verified User Flow
```
1. User with valid JWT token
2. Continue chatting (up to 50 chats)
3. No phone verification needed
```

## 🎯 Frontend Integration Examples

### JavaScript/React Example

```javascript
class ChatService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api/chat';
    this.token = localStorage.getItem('jwt_token');
  }

  // Send message to AI doctor
  async sendMessage(message, doctorType) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseURL}/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, doctorType })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const data = await response.text();
      
      // Parse response for token and AI response
      let token = null;
      let aiResponse = data;
      
      if (data.startsWith('TOKEN:')) {
        const lines = data.split('\n');
        token = lines[0].replace('TOKEN:', '');
        aiResponse = lines.slice(1).join('\n');
        
        // Store new token
        this.token = token;
        localStorage.setItem('jwt_token', token);
      }

      return { token, aiResponse };
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  // Get user chats
  async getChats(doctorType) {
    if (!this.token) {
      throw new Error('Token required');
    }

    const response = await fetch(`${this.baseURL}/${doctorType}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }

    return await response.json();
  }

  // Send OTP
  async sendOTP(phoneNumber) {
    if (!this.token) {
      throw new Error('Token required');
    }

    const response = await fetch(`${this.baseURL}/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ phoneNumber })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    return await response.json();
  }

  // Verify OTP
  async verifyOTP(phoneNumber, otp) {
    if (!this.token) {
      throw new Error('Token required');
    }

    const response = await fetch(`${this.baseURL}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ phoneNumber, otp })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    const data = await response.json();
    
    // Update token
    this.token = data.token;
    localStorage.setItem('jwt_token', data.token);
    
    return data;
  }
}

// Usage Example
const chatService = new ChatService();

// Send first message (creates anonymous user)
chatService.sendMessage('Hello doctor', 'gynecologist')
  .then(({ token, aiResponse }) => {
    console.log('AI Response:', aiResponse);
    console.log('Token stored:', !!token);
  })
  .catch(error => {
    if (error.message.includes('Phone verification required')) {
      // Handle phone verification flow
      console.log('Phone verification needed');
    }
  });
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

const useChat = () => {
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (message, doctorType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:3001/api/chat/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, doctorType })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const data = await response.text();
      
      let newToken = token;
      let aiResponse = data;
      
      if (data.startsWith('TOKEN:')) {
        const lines = data.split('\n');
        newToken = lines[0].replace('TOKEN:', '');
        aiResponse = lines.slice(1).join('\n');
        
        setToken(newToken);
        localStorage.setItem('jwt_token', newToken);
      }

      return aiResponse;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading, error, token };
};
```

## 🚨 Error Handling

### Common Error Responses

**400 - Bad Request:**
```json
{
  "success": false,
  "message": "Message and valid doctor type (gynecologist or general_practitioner) are required"
}
```

**401 - Unauthorized:**
```json
{
  "success": false,
  "message": "Token required"
}
```

**403 - Forbidden (Chat Limit Reached):**
```json
{
  "success": false,
  "message": "Phone verification required to continue chatting",
  "requiresPhone": true,
  "currentChats": 5,
  "maxChats": 5
}
```

**500 - Server Error:**
```
Sorry, I am having trouble responding right now. Please try again later.
```

## 🔐 JWT Token Management

### Token Format
```javascript
// Token structure
{
  "id": "user_id",
  "userType": "anonymous" | "verified",
  "iat": 1734567890,
  "exp": 1737159890
}
```

### Token Storage
```javascript
// Store token
localStorage.setItem('jwt_token', token);

// Retrieve token
const token = localStorage.getItem('jwt_token');

// Clear token
localStorage.removeItem('jwt_token');
```

### Token Usage
```javascript
// Include in headers
headers: {
  'Authorization': `Bearer ${token}`
}
```

## 📱 Phone Verification Flow

### Step 1: Send OTP
```javascript
await chatService.sendOTP('+1234567890');
// OTP sent to phone number
```

### Step 2: Verify OTP
```javascript
const result = await chatService.verifyOTP('+1234567890', '123456');
// User upgraded to verified status
// New token provided
// Chat limit increased to 50
```

## 🎨 UI/UX Recommendations

### 1. Loading States
- Show loading indicator while AI is responding
- Disable send button during processing

### 2. Error Handling
- Display user-friendly error messages
- Retry mechanism for failed requests

### 3. Chat Limit Warnings
- Show remaining chats for anonymous users
- Prompt for phone verification when limit reached

### 4. Token Management
- Automatically store tokens from responses
- Handle token expiration gracefully

### 5. Message Display
- Distinguish between user and AI messages
- Show timestamps for messages
- Handle streaming responses smoothly

## 🔧 Environment Setup

### Required Environment Variables
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/doc-chat-db
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_MESSAGING_SERVICE_SID=your-twilio-messaging-service-sid
TWILIO_MESSAGING_FROM=your-twilio-phone-number
REDIS_URL=your-redis-url
```

## 📞 Support

For integration issues or questions, please refer to the error messages and ensure all required environment variables are properly configured. 