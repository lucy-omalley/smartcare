import { NextResponse } from 'next/server';
import { getAIResponse } from '@/lib/services/chat';
import { ChatMessage } from '@/lib/store/chat';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages must be an array' },
        { status: 400 }
      );
    }

    // Validate each message
    for (const message of messages) {
      if (!message.content || typeof message.isUser !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid message format' },
          { status: 400 }
        );
      }
    }

    const response = await getAIResponse(messages as ChatMessage[]);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 