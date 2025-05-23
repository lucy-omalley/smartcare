import { Provider as PrismaProvider } from '@prisma/client';
import { DUBLIN_LOCATIONS, Location } from '../constants';

// Extend the Prisma Provider type with latitude and longitude
type Provider = PrismaProvider & {
  latitude?: number | null;
  longitude?: number | null;
};

interface MatchingCriteria {
  location: {
    latitude: number;
    longitude: number;
    maxDistance: number; // in kilometers
  };
  type: 'creche' | 'childminder';
  language?: string;
  maxHourlyRate?: number;
  requiredAvailability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  childAge?: number;
  specialNeeds?: boolean;
}

interface MatchingScore {
  provider: Provider;
  score: number;
  reasons: string[];
}

export class MatchingService {
  private static readonly EARTH_RADIUS = 6371; // Earth's radius in kilometers

  /**
   * Calculate distance between two points using Haversine formula
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS * c;
  }

  private static toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Check if provider's availability matches the required schedule
   */
  private static checkAvailability(
    providerAvailability: any,
    requiredAvailability: MatchingCriteria['requiredAvailability']
  ): boolean {
    const providerSchedule = providerAvailability.schedule || {};
    
    console.log('🔍 Checking availability:', {
      required: requiredAvailability,
      provider: providerSchedule
    });

    const matches = requiredAvailability.days.every(day => {
      const daySchedule = providerSchedule[day];
      if (!daySchedule) {
        console.log(`❌ No schedule for ${day}`);
        return false;
      }

      const requiredStart = new Date(`2000-01-01T${requiredAvailability.startTime}`);
      const requiredEnd = new Date(`2000-01-01T${requiredAvailability.endTime}`);
      const providerStart = new Date(`2000-01-01T${daySchedule.startTime}`);
      const providerEnd = new Date(`2000-01-01T${daySchedule.endTime}`);

      const isAvailable = providerStart <= requiredStart && providerEnd >= requiredEnd;
      console.log(`${day}: ${isAvailable ? '✅' : '❌'} Available ${daySchedule.startTime}-${daySchedule.endTime}`);
      return isAvailable;
    });

    console.log(`Overall availability match: ${matches ? '✅' : '❌'}`);
    return matches;
  }

  /**
   * Calculate matching score for a provider based on criteria
   */
  private static calculateScore(
    provider: Provider,
    criteria: MatchingCriteria
  ): MatchingScore {
    const reasons: string[] = [];
    let score = 0;

    // Double-check budget before scoring
    if (criteria.maxHourlyRate !== undefined && provider.hourlyRate > criteria.maxHourlyRate) {
      console.log(`❌ Provider ${provider.name} exceeds budget in scoring - should have been filtered out`);
      return { provider, score: 0, reasons: ['Provider exceeds your budget'] };
    }

    // Type match (40 points)
    if (provider.type === criteria.type) {
      score += 40;
      reasons.push('Provider type matches your requirements');
      console.log(`✅ Type match: ${provider.type} (40 points)`);
    } else {
      console.log(`❌ Type mismatch: ${provider.type} vs ${criteria.type}`);
    }

    // Add age group information for creches
    if (provider.type === 'creche' && criteria.childAge !== undefined && provider.crecheCapacity) {
      console.log(`\n🔍 Processing age group info for ${provider.name}:`);
      const capacity = provider.crecheCapacity as any;
      const availableSpaces = capacity.availableSpacesByAge;
      
      let ageGroup: string | undefined;
      if (criteria.childAge < 1) ageGroup = '0-1';
      else if (criteria.childAge < 2) ageGroup = '1-2';
      else if (criteria.childAge < 3) ageGroup = '2-3';
      else if (criteria.childAge < 4) ageGroup = '3-4';
      
      console.log(`- Child age: ${criteria.childAge}`);
      console.log(`- Age group: ${ageGroup}`);
      console.log(`- Available spaces:`, availableSpaces);
      
      if (ageGroup && availableSpaces[ageGroup]) {
        const spaces = availableSpaces[ageGroup];
        const message = `👶 Has ${spaces} available space${spaces === 1 ? '' : 's'} for ${ageGroup} year olds`;
        reasons.push(message);
        console.log(`✅ Added to reasons: ${message}`);
      } else {
        console.log(`❌ No available spaces found for age group ${ageGroup}`);
      }
    }

    // Location match (30 points)
    let distance = 0;
    let locationScore = 0;
    try {
      console.log(`\n🔍 Location validation for ${provider.name}:`, {
        providerCoordinates: {
          latitude: provider.latitude,
          longitude: provider.longitude,
          type: {
            latitude: typeof provider.latitude,
            longitude: typeof provider.longitude
          }
        },
        criteriaCoordinates: {
          latitude: criteria.location.latitude,
          longitude: criteria.location.longitude
        }
      });

      // Helper function to validate coordinates
      const isValidCoordinate = (coord: number | null | undefined): boolean => {
        const isValid = typeof coord === 'number' && 
          !isNaN(coord) && 
          coord >= -90 && 
          coord <= 90;
        
        if (!isValid) {
          console.log(`❌ Invalid coordinate:`, {
            value: coord,
            type: typeof coord,
            isNaN: typeof coord === 'number' ? isNaN(coord) : 'N/A',
            range: typeof coord === 'number' ? `${coord} is ${coord >= -90 && coord <= 90 ? 'within' : 'outside'} range` : 'N/A'
          });
        }
        
        return isValid;
      };

      // Get coordinates with validation
      const providerLat = provider.latitude;
      const providerLng = provider.longitude;
      const hasValidCoordinates = 
        isValidCoordinate(providerLat) && 
        isValidCoordinate(providerLng);

      console.log(`📍 Coordinate validation result:`, {
        provider: provider.name,
        hasValidCoordinates,
        latitude: {
          value: providerLat,
          isValid: isValidCoordinate(providerLat)
        },
        longitude: {
          value: providerLng,
          isValid: isValidCoordinate(providerLng)
        }
      });

      if (hasValidCoordinates && providerLat !== null && providerLng !== null) {
        // At this point we know the coordinates are valid numbers
        const lat = providerLat as number;
        const lng = providerLng as number;
        
        distance = this.calculateDistance(
          criteria.location.latitude,
          criteria.location.longitude,
          lat,
          lng
        );
        
        // Validate calculated distance
        if (isNaN(distance) || distance < 0) {
          console.error(`❌ Invalid distance calculated for ${provider.name}:`, {
            provider: { lat, lng },
            criteria: { lat: criteria.location.latitude, lng: criteria.location.longitude },
            distance,
            calculation: {
              dLat: this.toRad(criteria.location.latitude - lat),
              dLon: this.toRad(criteria.location.longitude - lng),
              a: Math.sin(this.toRad(criteria.location.latitude - lat) / 2) * 
                 Math.sin(this.toRad(criteria.location.latitude - lat) / 2) +
                 Math.cos(this.toRad(lat)) *
                 Math.cos(this.toRad(criteria.location.latitude)) *
                 Math.sin(this.toRad(criteria.location.longitude - lng) / 2) *
                 Math.sin(this.toRad(criteria.location.longitude - lng) / 2),
              c: 2 * Math.atan2(
                Math.sqrt(Math.sin(this.toRad(criteria.location.latitude - lat) / 2) * 
                         Math.sin(this.toRad(criteria.location.latitude - lat) / 2) +
                         Math.cos(this.toRad(lat)) *
                         Math.cos(this.toRad(criteria.location.latitude)) *
                         Math.sin(this.toRad(criteria.location.longitude - lng) / 2) *
                         Math.sin(this.toRad(criteria.location.longitude - lng) / 2)),
                Math.sqrt(1 - (Math.sin(this.toRad(criteria.location.latitude - lat) / 2) * 
                             Math.sin(this.toRad(criteria.location.latitude - lat) / 2) +
                             Math.cos(this.toRad(lat)) *
                             Math.cos(this.toRad(criteria.location.latitude)) *
                             Math.sin(this.toRad(criteria.location.longitude - lng) / 2) *
                             Math.sin(this.toRad(criteria.location.longitude - lng) / 2)))
              )
            }
          });
          reasons.push('Location information not available');
        } else {
          console.log(`✅ Distance calculation successful:`, {
            provider: provider.name,
            distance: `${distance.toFixed(1)}km`,
            maxAllowed: `${criteria.location.maxDistance}km`,
            coordinates: {
              provider: { lat, lng },
              criteria: { lat: criteria.location.latitude, lng: criteria.location.longitude }
            }
          });

          // Find the nearest Dublin location for the provider
          const providerLocation = DUBLIN_LOCATIONS.reduce((nearest: Location, current: Location) => {
            const currentDistance = this.calculateDistance(
              lat,
              lng,
              current.lat,
              current.lng
            );
            const nearestDistance = this.calculateDistance(
              lat,
              lng,
              nearest.lat,
              nearest.lng
            );
            return currentDistance < nearestDistance ? current : nearest;
          });

          reasons.push(`Provider is ${distance.toFixed(1)}km away in ${providerLocation.name}`);
          
          if (distance <= criteria.location.maxDistance) {
            locationScore = Math.max(
              0,
              30 * (1 - distance / criteria.location.maxDistance)
            );
            score += locationScore;
            console.log(`✅ Location score: ${locationScore.toFixed(1)} points`);
          } else {
            console.log(`❌ Location too far: ${distance.toFixed(1)}km > ${criteria.location.maxDistance}km`);
          }
        }
      } else {
        // If coordinates are missing, try to match by address
        console.log(`\n🔍 Attempting address match for ${provider.name}:`, {
          address: provider.address,
          availableLocations: DUBLIN_LOCATIONS.map(loc => loc.name)
        });

        const addressMatch = DUBLIN_LOCATIONS.find(loc => 
          provider.address.toLowerCase().includes(loc.name.toLowerCase())
        );
        
        if (addressMatch) {
          console.log(`✅ Found address match:`, {
            provider: provider.name,
            address: provider.address,
            matchedLocation: addressMatch.name,
            coordinates: { lat: addressMatch.lat, lng: addressMatch.lng }
          });

          distance = this.calculateDistance(
            criteria.location.latitude,
            criteria.location.longitude,
            addressMatch.lat,
            addressMatch.lng
          );
          
          if (distance <= criteria.location.maxDistance) {
            locationScore = Math.max(
              0,
              20 * (1 - distance / criteria.location.maxDistance)
            );
            score += locationScore;
            reasons.push(`Provider is approximately ${distance.toFixed(1)}km away in ${addressMatch.name} (based on address)`);
            console.log(`✅ Location score (from address): ${locationScore.toFixed(1)} points`);
          } else {
            console.log(`❌ Location too far (from address): ${distance.toFixed(1)}km > ${criteria.location.maxDistance}km`);
          }
        } else {
          console.log(`❌ No address match found for ${provider.name}:`, {
            address: provider.address,
            availableLocations: DUBLIN_LOCATIONS.map(loc => loc.name)
          });
          reasons.push('Location information not available');
        }
      }
    } catch (error) {
      console.error('❌ Error calculating distance:', error);
      reasons.push('Location information not available');
    }

    // Price match (15 points)
    if (criteria.maxHourlyRate && provider.hourlyRate <= criteria.maxHourlyRate) {
      const priceScore = Math.max(
        0,
        15 * (1 - provider.hourlyRate / criteria.maxHourlyRate)
      );
      score += priceScore;
      reasons.push('Provider fits within your budget');
      console.log(`💰 Price match: ${priceScore.toFixed(1)} points (Rate: €${provider.hourlyRate}/hr)`);
    } else {
      console.log(`❌ Price mismatch: €${provider.hourlyRate}/hr > €${criteria.maxHourlyRate}/hr`);
      return { provider, score: 0, reasons: ['Provider exceeds your budget'] };
    }

    // Availability match (15 points)
    const providerAvailability = provider.availability as any;
    if (providerAvailability && this.checkAvailability(providerAvailability, criteria.requiredAvailability)) {
      score += 15;
      reasons.push('Provider has matching availability');
      console.log(`✅ Availability match: 15 points`);
    } else {
      console.log(`❌ Availability mismatch for ${provider.name}`);
    }

    // Additional factors
    if (criteria.language && provider.description.toLowerCase().includes(criteria.language.toLowerCase())) {
      score += 5;
      reasons.push('Provider speaks your preferred language');
      console.log(`✅ Language match: 5 points (${criteria.language})`);
    }

    if (criteria.specialNeeds && provider.description.toLowerCase().includes('special needs')) {
      score += 5;
      reasons.push('Provider has experience with special needs');
      console.log(`✅ Special needs support: 5 points`);
    }

    console.log(`\n📊 Final score for ${provider.name}: ${score} points`);
    console.log('All reasons:', reasons);

    return {
      provider,
      score,
      reasons,
    };
  }

  /**
   * Find matching providers based on criteria
   */
  public static async findMatches(
    providers: Provider[],
    criteria: MatchingCriteria
  ): Promise<MatchingScore[]> {
    console.log('🔍 Starting matching process with criteria:', {
      type: criteria.type,
      location: criteria.location,
      maxHourlyRate: criteria.maxHourlyRate,
      requiredAvailability: criteria.requiredAvailability,
      specialNeeds: criteria.specialNeeds,
      language: criteria.language,
      childAge: criteria.childAge
    });

    // First filter by budget - make this the strictest filter
    let filteredProviders = providers;
    if (criteria.maxHourlyRate !== undefined) {
      console.log(`\n💰 STRICT BUDGET FILTER (max €${criteria.maxHourlyRate}/hr):`);
      filteredProviders = providers.filter(provider => {
        // Strict budget check with safety margin
        const isWithinBudget = provider.hourlyRate <= criteria.maxHourlyRate!;
        if (!isWithinBudget) {
          console.log(`❌ EXCLUDED: ${provider.name} - Rate €${provider.hourlyRate}/hr exceeds budget of €${criteria.maxHourlyRate}/hr`);
          return false;
        }
        console.log(`✅ INCLUDED: ${provider.name} - Rate €${provider.hourlyRate}/hr within budget`);
        return true;
      });
      console.log(`📊 After strict budget filtering: ${filteredProviders.length} providers within budget`);
      
      // Multiple validation checks
      const overBudgetProviders = filteredProviders.filter(p => p.hourlyRate > criteria.maxHourlyRate!);
      if (overBudgetProviders.length > 0) {
        console.error('❌ ERROR: Found providers over budget after filtering! Removing them...');
        console.error('Over budget providers:', overBudgetProviders.map(p => ({
          name: p.name,
          rate: p.hourlyRate,
          budget: criteria.maxHourlyRate
        })));
        filteredProviders = filteredProviders.filter(p => p.hourlyRate <= criteria.maxHourlyRate!);
      }
    }

    // Then filter by type
    filteredProviders = filteredProviders.filter(provider => {
      const typeMatch = provider.type === criteria.type;
      if (!typeMatch) {
        console.log(`❌ Type mismatch for ${provider.name}: ${provider.type} vs ${criteria.type}`);
      }
      return typeMatch;
    });
    console.log(`📊 After type filtering: ${filteredProviders.length} providers of correct type`);

    // For creches, filter by age group capacity
    if (criteria.type === 'creche' && criteria.childAge !== undefined) {
      console.log(`\n🔍 Filtering creches by age group for child age: ${criteria.childAge}`);
      filteredProviders = filteredProviders.filter(provider => {
        if (!provider.crecheCapacity) {
          console.log(`❌ No capacity data for ${provider.name}`);
          return false;
        }
        
        const capacity = provider.crecheCapacity as any;
        const availableSpaces = capacity.availableSpacesByAge;
        
        // Determine which age group the child falls into
        let ageGroup: string | undefined;
        const childAge = criteria.childAge!; // We know it's defined from the if check above
        if (childAge < 1) ageGroup = '0-1';
        else if (childAge < 2) ageGroup = '1-2';
        else if (childAge < 3) ageGroup = '2-3';
        else if (childAge < 4) ageGroup = '3-4';
        
        console.log(`\nChecking ${provider.name}:`);
        console.log(`- Child age: ${childAge}`);
        console.log(`- Age group: ${ageGroup}`);
        console.log(`- Available spaces:`, availableSpaces);
        
        if (!ageGroup || !availableSpaces[ageGroup]) {
          console.log(`❌ No available spaces for age group ${ageGroup} in ${provider.name}`);
          return false;
        }
        
        const spaces = availableSpaces[ageGroup];
        console.log(`✅ Found ${spaces} spaces for age group ${ageGroup}`);
        return spaces > 0;
      });
      console.log(`📊 After age group filtering: ${filteredProviders.length} creches have available spaces`);
    }

    // Calculate scores for filtered providers
    const matches = filteredProviders
      .map(provider => {
        // Double-check budget before scoring
        if (criteria.maxHourlyRate !== undefined && provider.hourlyRate > criteria.maxHourlyRate) {
          console.error(`❌ CRITICAL: Provider ${provider.name} exceeds budget in scoring - should have been filtered out`);
          return null;
        }
        
        console.log(`\n📊 Calculating score for provider: ${provider.name}`);
        const score = this.calculateScore(provider, criteria);
        console.log(`Score details for ${provider.name}:`, {
          totalScore: score.score,
          reasons: score.reasons
        });
        return score;
      })
      .filter((match): match is MatchingScore => {
        if (!match) return false;
        const hasScore = match.score > 0;
        console.log(`${match.provider.name}: ${hasScore ? '✅ Matched' : '❌ No match'}`);
        return hasScore;
      })
      .sort((a, b) => b.score - a.score);

    // Final validation of results
    if (criteria.maxHourlyRate !== undefined) {
      const overBudgetMatches = matches.filter(m => m.provider.hourlyRate > criteria.maxHourlyRate!);
      if (overBudgetMatches.length > 0) {
        console.error('❌ CRITICAL: Found matches over budget in final results! Removing them...');
        console.error('Over budget matches:', overBudgetMatches.map(m => ({
          name: m.provider.name,
          rate: m.provider.hourlyRate,
          budget: criteria.maxHourlyRate
        })));
        matches.splice(0, matches.length, ...matches.filter(m => m.provider.hourlyRate <= criteria.maxHourlyRate!));
      }
    }

    console.log('\n📈 Matching Summary:', {
      totalProviders: providers.length,
      filteredProviders: filteredProviders.length,
      matchesFound: matches.length,
      topMatches: matches.slice(0, 3).map(m => ({
        name: m.provider.name,
        type: m.provider.type,
        hourlyRate: m.provider.hourlyRate,
        score: m.score,
        reasons: m.reasons
      }))
    });

    return matches;
  }

  /**
   * Group providers by distance ranges
   */
  private static groupByDistance(matches: MatchingScore[]): { [key: string]: MatchingScore[] } {
    const groups: { [key: string]: MatchingScore[] } = {
      'Very Close (0-2km)': [],
      'Close (2-5km)': [],
      'Moderate (5-10km)': [],
      'Far (>10km)': [],
      'Location Unknown': [] // New group for providers with missing location data
    };

    matches.forEach(match => {
      const distanceMatch = match.reasons.find(r => r.includes('km away'));
      if (distanceMatch) {
        const distance = parseFloat(distanceMatch.match(/(\d+\.?\d*)km/)?.[1] || '0');
        
        if (distance <= 2) {
          groups['Very Close (0-2km)'].push(match);
        } else if (distance <= 5) {
          groups['Close (2-5km)'].push(match);
        } else if (distance <= 10) {
          groups['Moderate (5-10km)'].push(match);
        } else {
          groups['Far (>10km)'].push(match);
        }
      } else {
        // If no distance information is available, put in the "Location Unknown" category
        groups['Location Unknown'].push(match);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }

  /**
   * Generate a human-readable response for the chatbot
   */
  public static generateMatchingResponse(matches: MatchingScore[]): string {
    if (matches.length === 0) {
      return "I couldn't find any providers within your budget. Would you like to:\n" +
             "1. Adjust your budget\n" +
             "2. Look in a different area\n" +
             "3. Consider different availability times\n\n" +
             "What would you prefer to adjust?";
    }

    // Sort matches by score and distance
    const sortedMatches = [...matches].sort((a, b) => {
      // First sort by score
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort by distance
      const distanceA = parseFloat(a.reasons.find(r => r.includes('km away'))?.match(/(\d+\.?\d*)km/)?.[1] || '999');
      const distanceB = parseFloat(b.reasons.find(r => r.includes('km away'))?.match(/(\d+\.?\d*)km/)?.[1] || '999');
      return distanceA - distanceB;
    });

    // Group matches by distance
    const distanceGroups = this.groupByDistance(sortedMatches);

    // If no groups have matches, return a default response
    if (Object.keys(distanceGroups).length === 0) {
      return "Here are the best matches within your budget:\n\n" +
             this.formatProviderList(sortedMatches.slice(0, 3));
    }

    let response = "Here are the best matches within your budget, organized by distance:\n\n";

    // Process each distance group
    Object.entries(distanceGroups).forEach(([range, groupMatches]) => {
      response += `📍 ${range}:\n`;
      response += this.formatProviderList(groupMatches.slice(0, 2)); // Show fewer providers per group
    });

    // Add contact information and options
    response += "\nWould you like to:\n";
    response += "1. Get more details about any provider\n";
    response += "2. See more options\n";
    response += "3. Adjust your search criteria\n\n";
    response += "Just let me know what you'd like to do next!";

    return response;
  }

  /**
   * Format a list of providers for display
   */
  private static formatProviderList(matches: MatchingScore[]): string {
    let formatted = '';
    
    // Group by type
    const creches = matches.filter(m => m.provider.type === 'creche');
    const childminders = matches.filter(m => m.provider.type === 'childminder');

    if (creches.length > 0) {
      formatted += "  🏫 Creches:\n";
      creches.forEach((match, index) => {
        const provider = match.provider;
        const isValidCoordinate = (coord: number | null | undefined): coord is number => 
          typeof coord === 'number' && 
          !isNaN(coord) && 
          coord >= -90 && 
          coord <= 90;

        const hasValidCoordinates = 
          isValidCoordinate(provider.latitude) && 
          isValidCoordinate(provider.longitude);

        const location = hasValidCoordinates ?
          DUBLIN_LOCATIONS.find((loc: Location) => 
            Math.abs(loc.lat - provider.latitude!) < 0.1 && 
            Math.abs(loc.lng - provider.longitude!) < 0.1
          ) : undefined;
        
        formatted += `  ${index + 1}. ${provider.name} (€${provider.hourlyRate.toFixed(2)}/hr)\n`;
        formatted += `     📍 ${location ? location.name : 'Dublin'}\n`;
        formatted += `     🚶 ${match.reasons.find(r => r.includes('km away')) || 'Distance information not available'}\n`;
        
        // Find and display age group information
        const ageGroupInfo = match.reasons.find(r => r.startsWith('👶'));
        if (ageGroupInfo) {
          formatted += `     ${ageGroupInfo}\n`;
        }
        
        formatted += `     ⭐ ${provider.experience}\n\n`;
      });
    }

    if (childminders.length > 0) {
      formatted += "  👩‍👧 Childminders:\n";
      childminders.forEach((match, index) => {
        const provider = match.provider;
        const isValidCoordinate = (coord: number | null | undefined): coord is number => 
          typeof coord === 'number' && 
          !isNaN(coord) && 
          coord >= -90 && 
          coord <= 90;

        const hasValidCoordinates = 
          isValidCoordinate(provider.latitude) && 
          isValidCoordinate(provider.longitude);

        const location = hasValidCoordinates ?
          DUBLIN_LOCATIONS.find((loc: Location) => 
            Math.abs(loc.lat - provider.latitude!) < 0.1 && 
            Math.abs(loc.lng - provider.longitude!) < 0.1
          ) : undefined;
        
        formatted += `  ${index + 1}. ${provider.name} (€${provider.hourlyRate.toFixed(2)}/hr)\n`;
        formatted += `     📍 ${location ? location.name : 'Dublin'}\n`;
        formatted += `     🚶 ${match.reasons.find(r => r.includes('km away')) || 'Distance information not available'}\n`;
        formatted += `     ⭐ ${provider.experience}\n\n`;
      });
    }

    return formatted;
  }

  /**
   * Generate a welcome message for the chat interface
   */
  public static generateWelcomeMessage(): string {
    return "👋 Hi! I'm MumBot, your AI childcare assistant. I can help you find the perfect childcare provider in Dublin. Just tell me what you're looking for!\n\n" +
           "For example, you can ask me:\n" +
           "• \"I need a creche in Rathmines for my 2-year-old\"\n" +
           "• \"Find childminders in Clontarf under €15 per hour\"\n" +
           "• \"Show me creches in Blackrock with availability Monday to Friday\"\n\n" +
           "What kind of childcare are you looking for?";
  }
} 