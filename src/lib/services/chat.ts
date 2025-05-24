import OpenAI from 'openai';
import { ChatMessage } from '@/lib/store/chat';
import { MatchingService } from './matching';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Dublin locations with coordinates
const DUBLIN_LOCATIONS = [
  { name: 'Dublin City Centre', lat: 53.3498, lng: -6.2603 },
  { name: 'Dundrum', lat: 53.2924, lng: -6.2457 },
  { name: 'Swords', lat: 53.4597, lng: -6.2181 },
  { name: 'Dún Laoghaire', lat: 53.2947, lng: -6.1361 },
  { name: 'Tallaght', lat: 53.2879, lng: -6.3544 },
  { name: 'Blanchardstown', lat: 53.3887, lng: -6.3777 },
  { name: 'Sandyford', lat: 53.2747, lng: -6.2253 },
  { name: 'Clontarf', lat: 53.3634, lng: -6.1928 },
  { name: 'Rathmines', lat: 53.3217, lng: -6.2677 },
  { name: 'Malahide', lat: 53.4508, lng: -6.1544 },
];

export const SYSTEM_PROMPT = `You are MumBot, an AI childcare assistant helping parents find the perfect childcare solution in Ireland. You are knowledgeable about:
- Irish childcare regulations and standards
- EU childcare subsidies and eligibility
- Local childcare facilities and services
- Emergency childcare options
- Language support for immigrant families

Your goal is to help parents find suitable childcare options within 30 seconds, considering their specific needs, location, and preferences. Be professional, empathetic, and focused on providing practical solutions.

When parents ask about finding childcare, ask them about:
1. Their preferred type (creche or childminder)
2. Their location
3. Required days and times
4. Their budget
5. Any special requirements (language, special needs, etc.)

Once you have this information, use the matching algorithm to find suitable providers.`;

export async function getAIResponse(messages: ChatMessage[]): Promise<string> {
  try {
    // Get the last user message
    const lastUserMessage = messages.filter(m => m.isUser).pop();
    if (!lastUserMessage) {
      return "I'm here to help you find childcare in Ireland. What would you like to know?";
    }

    const content = lastUserMessage.content.toLowerCase();

    // Check if this is a request for provider details
    const isProviderDetailRequest = content.includes('more details') || 
                                  content.includes('tell me more') || 
                                  content.includes('about') ||
                                  content.includes('information') ||
                                  content.match(/provider\s+\d+/i) ||
                                  content.match(/option\s+\d+/i);

    if (isProviderDetailRequest) {
      // Use OpenAI to get detailed information about childcare providers
      const openAIMessages = [
        { 
          role: 'system' as const, 
          content: SYSTEM_PROMPT + "\n\nWhen asked about provider details, provide comprehensive information about:\n" +
                   "1. General information about the type of provider (creche or childminder)\n" +
                   "2. Typical services and facilities offered\n" +
                   "3. Average costs and pricing factors\n" +
                   "4. Common regulations and standards\n" +
                   "5. Tips for choosing and evaluating providers\n" +
                   "6. Questions parents should ask when visiting\n" +
                   "7. Recent trends and developments in Irish childcare\n" +
                   "Be specific to the Irish context and include relevant regulations and standards."
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

      return response.choices[0]?.message?.content || 'I apologize, but I am unable to provide detailed information at the moment. Please try again later.';
    }

    // Check if this is a matching request
    const isMatchingRequest = content.includes('find') || 
                            content.includes('looking for') || 
                            content.includes('need') || 
                            content.includes('search') ||
                            (content.includes('creche') || content.includes('childminder'));

    if (isMatchingRequest) {
      const criteria = await extractMatchingCriteria(messages);
      
      // Check if we need to return a clarification response
      if (criteria && 'needsClarification' in criteria) {
        return criteria.response;
      }

      if (criteria) {
        console.log('Extracted criteria:', criteria);
        
        // Get all providers from the database
        const providers = await prisma.provider.findMany({
          where: {
            status: 'approved',
          },
        });
        
        console.log('Found providers:', providers.length);

        if (providers.length === 0) {
          // Use OpenAI for a more natural response about no providers being available
          const openAIMessages = [
            { 
              role: 'system' as const, 
              content: SYSTEM_PROMPT + "\n\nWhen no providers are available in the database, provide a helpful and empathetic response that:\n" +
                       "1. Acknowledges the current unavailability\n" +
                       "2. Suggests alternative options (like checking back later or contacting support)\n" +
                       "3. Offers to help with other childcare-related questions\n" +
                       "4. Maintains a supportive and professional tone"
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

          return response.choices[0]?.message?.content || "I apologize, but I couldn't find any approved providers at the moment. Please try again later or contact our support team for assistance.";
        }

        // Find matches using the matching service
        const matches = await MatchingService.findMatches(providers, criteria);
        console.log('Found matches:', matches.length);
        
        // Generate a response with the matches
        const response = MatchingService.generateMatchingResponse(matches, criteria);
        console.log('Generated response:', response);
        return response;
      }

      // If criteria extraction failed, use OpenAI to ask for more information in a natural way
      const openAIMessages = [
        { 
          role: 'system' as const, 
          content: SYSTEM_PROMPT + "\n\nWhen asking for more information about childcare needs, be conversational and natural. Consider:\n" +
                   "1. The user's previous messages for context\n" +
                   "2. What specific information is still needed\n" +
                   "3. How to make the request feel like a natural conversation\n" +
                   "4. Providing examples of what kind of information would be helpful\n" +
                   "5. Maintaining a helpful and friendly tone\n" +
                   "Focus on the most relevant missing information based on the conversation context."
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

      return response.choices[0]?.message?.content || "I see you're looking for childcare in Dublin. To help you find the best match, could you tell me whether you're interested in a creche or a childminder? Also, which area of Dublin would be most convenient for you? I can then help you find options that fit your schedule and preferences.";
    }

    // For general questions, use OpenAI
    const openAIMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
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

    return response.choices[0]?.message?.content || 'I apologize, but I am unable to respond at the moment. Please try again later.';
  } catch (error) {
    console.error('Error getting AI response:', error);
    return 'I apologize, but I encountered an error. Please try again later.';
  }
}

export async function extractMatchingCriteria(messages: ChatMessage[]): Promise<any> {
  // Get only the most recent user message
  const lastUserMessage = messages.filter(m => m.isUser).pop();
  if (!lastUserMessage) return null;

  // Use only the last message for context
  const fullContext = lastUserMessage.content.toLowerCase();
  
  // Extract provider type
  let type: 'creche' | 'childminder' | undefined;
  if (fullContext.includes('creche')) {
    type = 'creche';
  } else if (fullContext.includes('childminder')) {
    type = 'childminder';
  }

  // If no type specified, use OpenAI to ask for clarification
  if (!type) {
    const openAIMessages = [
      { 
        role: 'system' as const, 
        content: SYSTEM_PROMPT + "\n\nWhen the user hasn't specified their preferred type of childcare (creche or childminder), provide a natural and conversational response that:\n" +
                 "1. Acknowledges their search for childcare\n" +
                 "2. Explains the difference between creches and childminders in Ireland\n" +
                 "3. Asks which type they prefer in a natural way\n" +
                 "4. Provides context about what each type offers\n" +
                 "5. Maintains a helpful and friendly tone\n" +
                 "Focus on making the conversation feel natural while gathering the necessary information."
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

    // Return a special object that indicates we need to use the OpenAI response
    return { 
      needsClarification: true,
      response: response.choices[0]?.message?.content || "I'd be happy to help you find childcare. In Ireland, we have two main types of childcare: creches (childcare centers) and childminders (home-based care). Creches are larger facilities that can accommodate more children and often have structured programs, while childminders provide care in their homes, offering a more intimate setting. Which type would you prefer for your child?"
    };
  }

  // Extract location with improved matching
  let selectedLocation = DUBLIN_LOCATIONS[0]; // Default to Dublin City Centre
  let locationFound = false;

  console.log('\n🔍 Location extraction:', {
    fullContext,
    availableLocations: DUBLIN_LOCATIONS.map(loc => ({
      name: loc.name,
      coordinates: { lat: loc.lat, lng: loc.lng }
    }))
  });

  // First try to find location keywords in the message
  const locationKeywords = [
    'in', 'near', 'around', 'close to', 'at', 'located in', 'based in'
  ];

  // Try to find location after keywords
  for (const keyword of locationKeywords) {
    const regex = new RegExp(`${keyword}\\s+([A-Za-z\\s]+)`, 'i');
    const match = fullContext.match(regex);
    if (match) {
      const mentionedLocation = match[1].trim().toLowerCase();
      console.log(`Found location keyword "${keyword}" with value:`, mentionedLocation);

      // Try exact match first
      const exactMatch = DUBLIN_LOCATIONS.find(loc => 
        loc.name.toLowerCase() === mentionedLocation
      );
      if (exactMatch) {
        selectedLocation = exactMatch;
        locationFound = true;
        console.log(`✅ Found exact location match:`, {
          name: selectedLocation.name,
          coordinates: { lat: selectedLocation.lat, lng: selectedLocation.lng }
        });
        break;
      }

      // Try partial match
      const partialMatch = DUBLIN_LOCATIONS.find(loc => 
        loc.name.toLowerCase().includes(mentionedLocation) ||
        mentionedLocation.includes(loc.name.toLowerCase())
      );
      if (partialMatch) {
        selectedLocation = partialMatch;
        locationFound = true;
        console.log(`✅ Found partial location match:`, {
          name: selectedLocation.name,
          coordinates: { lat: selectedLocation.lat, lng: selectedLocation.lng }
        });
        break;
      }
    }
  }

  // If no location found with keywords, try direct location name matching
  if (!locationFound) {
    console.log('No location found with keywords, trying direct matching...');
    
    // Try exact matches first
    for (const loc of DUBLIN_LOCATIONS) {
      const locName = loc.name.toLowerCase();
      if (new RegExp(`\\b${locName}\\b`).test(fullContext)) {
        selectedLocation = loc;
        locationFound = true;
        console.log(`✅ Found direct exact match:`, {
          name: selectedLocation.name,
          coordinates: { lat: selectedLocation.lat, lng: selectedLocation.lng }
        });
        break;
      }
    }

    // If still no match, try partial matches
    if (!locationFound) {
      for (const loc of DUBLIN_LOCATIONS) {
        const locName = loc.name.toLowerCase();
        if (fullContext.includes(locName)) {
          selectedLocation = loc;
          locationFound = true;
          console.log(`✅ Found direct partial match:`, {
            name: selectedLocation.name,
            coordinates: { lat: selectedLocation.lat, lng: selectedLocation.lng }
          });
          break;
        }
      }
    }
  }

  if (!locationFound) {
    console.log('❌ No location match found, using default:', {
      name: selectedLocation.name,
      coordinates: { lat: selectedLocation.lat, lng: selectedLocation.lng }
    });
  }

  // Extract budget
  let maxHourlyRate = 20; // Default €20 per hour
  const budgetMatch = fullContext.match(/(?:€|euro|euros?)\s*(\d+)/i);
  if (budgetMatch) {
    maxHourlyRate = parseInt(budgetMatch[1]);
  }

  // Extract days
  const days = [];
  const dayPatterns = {
    monday: /monday|mon/i,
    tuesday: /tuesday|tue/i,
    wednesday: /wednesday|wed/i,
    thursday: /thursday|thu/i,
    friday: /friday|fri/i,
  };

  for (const [day, pattern] of Object.entries(dayPatterns)) {
    if (pattern.test(fullContext)) {
      days.push(day);
    }
  }

  // If no specific days mentioned, default to weekdays
  if (days.length === 0) {
    days.push('monday', 'wednesday', 'friday');
  }

  // Extract time
  let startTime = '09:00';
  let endTime = '17:00';
  
  const timePattern = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi;
  const times = Array.from(fullContext.matchAll(timePattern));
  
  if (times.length >= 2) {
    const [start, end] = times;
    startTime = formatTime(start[1], start[2], start[3]);
    endTime = formatTime(end[1], end[2], end[3]);
  }

  // Extract special requirements
  const specialNeeds = fullContext.includes('special needs') || 
                      fullContext.includes('autism') || 
                      fullContext.includes('adhd');

  // Extract language preferences
  const languages = ['English', 'Irish', 'Polish', 'Chinese', 'French', 'Spanish', 'Portuguese'];
  const preferredLanguage = languages.find(lang => 
    fullContext.includes(lang.toLowerCase())
  );

  // Ensure we have valid coordinates
  const location = {
    latitude: selectedLocation.lat,
    longitude: selectedLocation.lng,
    maxDistance: 10, // 10km radius
  };

  console.log('Final location criteria:', {
    name: selectedLocation.name,
    coordinates: location,
    wasFound: locationFound
  });

  return {
    type,
    location,
    requiredAvailability: {
      days,
      startTime,
      endTime,
    },
    maxHourlyRate,
    specialNeeds,
    language: preferredLanguage,
  };
}

function formatTime(hours: string, minutes: string | undefined, period: string): string {
  let h = parseInt(hours);
  const m = minutes ? parseInt(minutes) : 0;
  
  if (period.toLowerCase() === 'pm' && h < 12) {
    h += 12;
  } else if (period.toLowerCase() === 'am' && h === 12) {
    h = 0;
  }
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
} 