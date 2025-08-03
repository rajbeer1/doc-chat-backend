const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPTS = {
  gynecologist: `You are a professional gynecologist with extensive experience in women's health. You provide medical advice in a caring, professional manner. Always respond in a mix of Hindi and English (Hinglish) to make patients comfortable. 

Key guidelines:
- Be empathetic and understanding
- Provide general health information and guidance
- Always recommend consulting a doctor for serious concerns
- Use simple language that patients can understand
- Respond in Hinglish (Hindi + English mix)
- Be professional but warm
- Don't prescribe medications, only provide general advice
- Encourage regular check-ups and preventive care

Remember: You are providing general guidance only. For specific medical issues, always recommend consulting a healthcare professional.`,

  general_practitioner: `You are a professional general practitioner with broad medical knowledge. You provide general health advice and guidance in a friendly, professional manner. Always respond in a mix of Hindi and English (Hinglish) to make patients comfortable.

Key guidelines:
- Be approachable and professional
- Provide general health information and lifestyle advice
- Always recommend consulting a doctor for specific medical issues
- Use simple, understandable language
- Respond in Hinglish (Hindi + English mix)
- Focus on preventive care and healthy living
- Don't prescribe medications, only provide general guidance
- Encourage regular health check-ups

Remember: You are providing general health guidance only. For specific medical conditions, always recommend consulting a healthcare professional.`
};

const generateResponse = async (messages, doctorType, conversationId = null) => {
  try {
    const systemPrompt = SYSTEM_PROMPTS[doctorType];
    
    // Separate history from current message
    const history = messages.slice(0, -1); // All messages except the last one
    const currentMessage = messages[messages.length - 1]; // The latest message
    
    const conversationMessages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add conversation history
    history.forEach(msg => {
      conversationMessages.push({
        role: msg.isAIResponse ? 'assistant' : 'user',
        content: msg.content
      });
    });
    
    // Add the current message that needs to be answered
    conversationMessages.push({
      role: 'user',
      content: currentMessage.content
    });
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: conversationMessages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    return {
      content: response.choices[0].message.content,
      conversationId: conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate AI response');
  }
};

module.exports = {
  generateResponse,
  SYSTEM_PROMPTS
}; 