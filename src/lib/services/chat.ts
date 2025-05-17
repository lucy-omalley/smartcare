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

const SYSTEM_PROMPT = `You are MumBot, an AI childcare assistant helping parents find the perfect childcare solution in Ireland. You are knowledgeable about:
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

    // Check if this is a matching request
    const isMatchingRequest = content.includes('find') || 
                            content.includes('looking for') || 
                            content.includes('need') || 
                            content.includes('search') ||
                            (content.includes('creche') || content.includes('childminder'));

    if (isMatchingRequest) {
      const criteria = extractMatchingCriteria(messages);
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
          return "I couldn't find any approved providers in the database. Please try again later or contact support.";
        }

        // Find matches using the matching service
        const matches = await MatchingService.findMatches(providers, criteria);
        console.log('Found matches:', matches.length);
        
        // If no matches found, ask for more information
        if (matches.length === 0) {
          return "I couldn't find any providers matching your current criteria. Could you please provide more details about:\n" +
                 "1. Your preferred location in Dublin\n" +
                 "2. The days and times you need childcare\n" +
                 "3. Your budget per hour\n" +
                 "4. Any special requirements (language, special needs, etc.)";
        }

        // Generate a response with the matches
        const response = MatchingService.generateMatchingResponse(matches);
        console.log('Generated response:', response);
        return response;
      } else {
        // If criteria extraction failed, ask for more information
        return "To help you find the right childcare, I need to know which type of provider you're looking for:\n" +
               "1. Would you prefer a creche (a childcare center) or a childminder (home-based care)?\n" +
               "2. Which area of Dublin are you looking in?\n" +
               "3. What days and times do you need childcare?\n" +
               "4. What's your budget per hour?\n" +
               "5. Do you have any special requirements?";
      }
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

// Export the extractMatchingCriteria function
export function extractMatchingCriteria(messages: ChatMessage[]): any {
  // Get all user messages for context
  const userMessages = messages.filter(m => m.isUser);
  if (userMessages.length === 0) return null;

  // Combine all user messages for better context
  const fullContext = userMessages.map(m => m.content.toLowerCase()).join(' ');
  
  // Extract provider type
  let type: 'creche' | 'childminder' | undefined;
  if (fullContext.includes('creche')) {
    type = 'creche';
  } else if (fullContext.includes('childminder')) {
    type = 'childminder';
  }

  // If no type specified, return null to ask for clarification
  if (!type) {
    return null;
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