import { NextResponse } from 'next/server';
import { MatchingService } from '@/lib/services/matching';
import { prisma } from '@/lib/db';
import { extractMatchingCriteria, SYSTEM_PROMPT } from '@/lib/services/chat';
import { Provider } from '@prisma/client';
import { OpenAI } from 'openai';

// Update the interface to match Prisma's Provider type
type ProviderWithLocation = Provider;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Get the last user message
    const lastUserMessage = messages
      .filter(m => m.isUser)
      .pop()?.content;

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Extract matching criteria using the chat service
    const criteria = await extractMatchingCriteria(messages);
    console.log('Extracted criteria:', criteria);

    // Check if we need to return a clarification response
    if (criteria && 'needsClarification' in criteria) {
      return NextResponse.json(
        { response: criteria.response },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (!criteria) {
      // Use OpenAI for a general response when no criteria is available
      const openAIMessages = [
        { 
          role: 'system' as const, 
          content: SYSTEM_PROMPT + "\n\nWhen starting a new childcare search conversation, provide a welcoming and informative response that:\n" +
                   "1. Introduces yourself as a childcare assistant\n" +
                   "2. Explains that you can help find both creches and childminders\n" +
                   "3. Asks about their childcare needs in a natural way\n" +
                   "4. Provides examples of the kind of information that would be helpful\n" +
                   "5. Maintains a friendly and professional tone"
        },
        ...messages.map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.content,
        })),
      ];

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: openAIMessages,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
      });

      return NextResponse.json(
        { 
          response: response.choices[0]?.message?.content || "Hi! I'm here to help you find the perfect childcare solution in Dublin. I can help you find both creches (childcare centers) and childminders (home-based care). Could you tell me a bit about what you're looking for? For example, which type of care interests you, and which area of Dublin would be most convenient?"
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Get all providers
    const providers = await prisma.provider.findMany({
      where: {
        status: 'approved'
      }
    });

    // Use MatchingService to find matches
    const matches = await MatchingService.findMatches(providers, criteria);
    console.log('Found matches:', matches.length);

    // Generate response using MatchingService
    const response = matches.length > 0
      ? MatchingService.generateMatchingResponse(matches, criteria)
      : "I couldn't find any providers matching your current criteria. Could you please provide more details about:\n" +
        "1. Your preferred location in Dublin\n" +
        "2. The days and times you need childcare\n" +
        "3. Your budget per hour\n" +
        "4. Any special requirements (language, special needs, etc.)";

    return NextResponse.json(
      { response },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 