import { NextResponse } from 'next/server';
import { MatchingService } from '@/lib/services/matching';
import { prisma } from '@/lib/db';
import { extractMatchingCriteria } from '@/lib/services/chat';
import { Provider } from '@prisma/client';

interface ProviderWithLocation extends Provider {
  latitude?: number | null;
  longitude?: number | null;
}

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

    // Get all providers
    const providers = await prisma.provider.findMany({
      where: {
        status: 'approved'
      }
    }) as ProviderWithLocation[];

    // Extract matching criteria using the chat service
    const criteria = extractMatchingCriteria(messages);
    console.log('Extracted criteria:', criteria);

    if (!criteria) {
      return NextResponse.json(
        { 
          response: "To help you find the right childcare, I need to know which type of provider you're looking for:\n" +
                   "1. Would you prefer a creche (a childcare center) or a childminder (home-based care)?\n" +
                   "2. Which area of Dublin are you looking in?\n" +
                   "3. What days and times do you need childcare?\n" +
                   "4. What's your budget per hour?\n" +
                   "5. Do you have any special requirements?"
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Use MatchingService to find matches
    const matches = await MatchingService.findMatches(providers, criteria);
    console.log('Found matches:', matches.length);

    // Generate response using MatchingService
    const response = matches.length > 0
      ? MatchingService.generateMatchingResponse(matches)
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