import { MatchingService } from './matching';
import { Provider } from '@prisma/client';
import { DUBLIN_LOCATIONS } from '../../lib/constants';

// Sample providers for testing
const sampleProviders: Provider[] = [
  {
    id: '1',
    name: 'Sunshine Creche',
    email: 'sunshine@example.com',
    phone: '1234567890',
    type: 'creche',
    address: '53.3498, -6.2603', // Dublin City Centre
    description: 'A warm and welcoming creche with English and French speaking staff. Special needs support available.',
    experience: '10 years of experience',
    status: 'approved',
    hourlyRate: 15.00,
    availability: {
      schedule: {
        monday: { startTime: '08:00', endTime: '18:00' },
        tuesday: { startTime: '08:00', endTime: '18:00' },
        wednesday: { startTime: '08:00', endTime: '18:00' },
        thursday: { startTime: '08:00', endTime: '18:00' },
        friday: { startTime: '08:00', endTime: '18:00' }
      }
    },
    crecheCapacity: {
      totalSpaces: 30,
      availableSpaces: 5,
      ageGroups: {
        '0-1': 8,
        '1-2': 8,
        '2-3': 7,
        '3-4': 7
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Happy Childminder',
    email: 'happy@example.com',
    phone: '0987654321',
    type: 'childminder',
    address: '53.2921, -6.2457', // Dundrum
    description: 'Experienced childminder with special needs experience. Speaks English and Polish.',
    experience: '8 years of experience',
    status: 'approved',
    hourlyRate: 12.50,
    availability: {
      schedule: {
        monday: { startTime: '07:30', endTime: '17:30' },
        tuesday: { startTime: '07:30', endTime: '17:30' },
        wednesday: { startTime: '07:30', endTime: '17:30' },
        thursday: { startTime: '07:30', endTime: '17:30' },
        friday: { startTime: '07:30', endTime: '17:30' }
      }
    },
    crecheCapacity: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function runTests() {
  console.log('🧪 Starting Matching Service Tests\n');

  // Test 1: Basic matching in Dublin City Centre
  console.log('Test 1: Basic matching in Dublin City Centre');
  const criteria1 = {
    location: {
      latitude: 53.3498,
      longitude: -6.2603,
      maxDistance: 5
    },
    type: 'creche' as const,
    requiredAvailability: {
      days: ['monday', 'wednesday', 'friday'],
      startTime: '09:00',
      endTime: '17:00'
    }
  };

  const matches1 = await MatchingService.findMatches(sampleProviders, criteria1);
  console.log('Response:', MatchingService.generateMatchingResponse(matches1));
  console.log('\n---\n');

  // Test 2: Matching with language requirement
  console.log('Test 2: Matching with language requirement');
  const criteria2 = {
    location: {
      latitude: 53.2921,
      longitude: -6.2457,
      maxDistance: 10
    },
    type: 'childminder' as const,
    language: 'Polish',
    requiredAvailability: {
      days: ['monday', 'tuesday', 'wednesday'],
      startTime: '08:00',
      endTime: '16:00'
    }
  };

  const matches2 = await MatchingService.findMatches(sampleProviders, criteria2);
  console.log('Response:', MatchingService.generateMatchingResponse(matches2));
  console.log('\n---\n');

  // Test 3: Matching with special needs
  console.log('Test 3: Matching with special needs');
  const criteria3 = {
    location: {
      latitude: 53.3498,
      longitude: -6.2603,
      maxDistance: 15
    },
    type: 'creche' as const,
    specialNeeds: true,
    maxHourlyRate: 20,
    requiredAvailability: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startTime: '08:00',
      endTime: '18:00'
    }
  };

  const matches3 = await MatchingService.findMatches(sampleProviders, criteria3);
  console.log('Response:', MatchingService.generateMatchingResponse(matches3));
  console.log('\n---\n');

  // Test 4: No matches scenario
  console.log('Test 4: No matches scenario');
  const criteria4 = {
    location: {
      latitude: 53.3498,
      longitude: -6.2603,
      maxDistance: 1
    },
    type: 'creche' as const,
    maxHourlyRate: 10,
    requiredAvailability: {
      days: ['saturday', 'sunday'],
      startTime: '08:00',
      endTime: '18:00'
    }
  };

  const matches4 = await MatchingService.findMatches(sampleProviders, criteria4);
  console.log('Response:', MatchingService.generateMatchingResponse(matches4));
}

// Run the tests
runTests().catch(console.error); 