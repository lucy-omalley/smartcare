import { NextResponse } from 'next/server';
import { getAIResponse } from '@/lib/services/chat';
import { ChatMessage } from '@/lib/store/chat';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return NextResponse.json(
        { error: 'Messages must be an array' },
        { status: 400 }
      );
    }

    // Validate each message
    for (const message of messages) {
      if (!message.content || typeof message.isUser !== 'boolean') {
        console.error('Invalid message format:', message);
        return NextResponse.json(
          { error: 'Invalid message format' },
          { status: 400 }
        );
      }
    }

    console.log('Processing chat request with messages:', messages.length);
    const response = await getAIResponse(messages as ChatMessage[]);
    console.log('Generated response:', response);

    if (!response) {
      console.error('No response generated');
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 