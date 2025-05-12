import OpenAI from 'openai';
import { ChatMessage } from '@/lib/store/chat';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are MumBot, an AI childcare assistant helping parents find the perfect childcare solution in Ireland. You are knowledgeable about:
- Irish childcare regulations and standards
- EU childcare subsidies and eligibility
- Local childcare facilities and services
- Emergency childcare options
- Language support for immigrant families

Your goal is to help parents find suitable childcare options within 30 seconds, considering their specific needs, location, and preferences. Be professional, empathetic, and focused on providing practical solutions.`;

export async function getAIResponse(messages: ChatMessage[]): Promise<string> {
  try {
    // Convert our chat messages to OpenAI format
    const openAIMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content,
      })),
    ];

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: openAIMessages,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
    });

    return response.choices[0]?.message?.content || 'I apologize, but I am unable to respond at the moment. Please try again later.';
  } catch (error) {
    console.error('Error getting AI response:', error);
    return 'I apologize, but I encountered an error. Please try again later.';
  }
} 