import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dublin locations with coordinates for seeding
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

const LANGUAGES = ['English', 'Irish', 'Polish', 'Chinese', 'French', 'Spanish', 'Portuguese'];
const SPECIAL_NEEDS = ['Autism', 'ADHD', 'Physical Disabilities', 'Speech Therapy', 'Sensory Processing'];

// Realistic provider names and descriptions
const CRECHE_NAMES = [
  'Little Explorers Creche',
  'Sunshine Daycare',
  'Rainbow Kids Academy',
  'Tiny Tots Nursery',
  'Happy Hearts Creche',
  'Bright Beginnings',
  'Wonderland Early Learning',
  'Little Stars Creche',
  'Magic Moments Nursery',
  'Growing Minds Academy',
  'Little Angels Creche',
  'Sunny Days Nursery',
  'Rainbow Bridge Academy',
  'Tiny Treasures Creche',
  'Happy Days Nursery',
  'Bright Futures Academy',
  'Wonder World Creche',
  'Little Learners Nursery',
  'Magic Garden Academy',
  'Growing Together Creche'
];

const CHILDMINDER_NAMES = [
  'Mary\'s Home Childcare',
  'Family First Childminding',
  'Home Sweet Home Childcare',
  'Little Angels Childminding',
  'Nurturing Nest Childcare',
  'Family Care Childminding',
  'Home Away From Home',
  'Little Learners Childcare',
  'Family Circle Childminding',
  'Home Grown Childcare',
  'Sarah\'s Home Childcare',
  'Family Time Childminding',
  'Home Comfort Childcare',
  'Little Stars Childminding',
  'Nurturing Hearts Childcare',
  'Family Focus Childminding',
  'Home Base Childcare',
  'Little Explorers Childminding',
  'Family Fun Childcare',
  'Home Sweet Home Childminding',
  'Emma\'s Home Childcare',
  'Family Matters Childminding',
  'Home Care Childcare',
  'Little Treasures Childminding',
  'Nurturing Minds Childcare',
  'Family First Childminding',
  'Home Support Childcare',
  'Little Angels Childminding',
  'Family Care Childcare',
  'Home Sweet Home Childminding'
];

const CRECHE_DESCRIPTIONS = [
  'A modern, purpose-built facility with spacious indoor and outdoor play areas. Our experienced staff provide a nurturing environment where children can learn and grow.',
  'State-of-the-art creche with a focus on early childhood development. We offer a balanced curriculum of play-based learning and structured activities.',
  'Family-run creche with a warm, welcoming atmosphere. We pride ourselves on our small group sizes and individual attention to each child.',
  'Eco-friendly creche with organic meals and sustainable practices. Our curriculum includes nature-based learning and outdoor activities.',
  'Multilingual creche offering immersion programs in multiple languages. Our diverse staff creates an inclusive environment for all children.',
  'Modern creche with a focus on STEM education. We provide hands-on learning experiences and encourage curiosity and exploration.',
  'Traditional creche with a strong emphasis on Irish culture and language. We offer a bilingual program and celebrate Irish traditions.',
  'Montessori-inspired creche that encourages independence and self-directed learning. Our environment is designed to foster natural development.',
  'Arts-focused creche with dedicated spaces for music, dance, and visual arts. We nurture creativity and self-expression in all children.',
  'Sports-oriented creche with daily physical activities and outdoor play. We promote healthy habits and physical development.',
  'Nature-based creche with extensive outdoor facilities. We believe in learning through exploration and connection with nature.',
  'Technology-integrated creche with age-appropriate digital learning tools. We prepare children for the digital age while maintaining balance.',
  'Community-focused creche that emphasizes social skills and cooperation. We build strong relationships with families and the local community.',
  'Inclusive creche with specialized support for children with additional needs. We create an environment where every child can thrive.',
  'Music and movement creche with daily rhythm activities. We use music to enhance learning and development across all areas.',
  'Language-rich creche with a strong focus on communication skills. We support children in developing strong verbal and non-verbal skills.',
  'Creative arts creche with dedicated art studios and performance spaces. We encourage self-expression through various art forms.',
  'Science-focused creche with hands-on experiments and discovery. We nurture curiosity and scientific thinking from an early age.',
  'Outdoor learning creche with nature-based curriculum. We believe in the benefits of outdoor education and environmental awareness.',
  'Family-centered creche with flexible hours and parent involvement. We work closely with families to support each child\'s development.'
];

const CHILDMINDER_DESCRIPTIONS = [
  'Experienced childminder providing a home-from-home environment. I offer flexible hours and personalized care for your child.',
  'Qualified childminder with a background in early childhood education. My home is set up as a safe, stimulating environment for children.',
  'Family-oriented childminder with experience in special needs care. I provide a nurturing, structured environment with regular outdoor activities.',
  'Registered childminder offering a small, intimate setting for your child. I focus on creating a warm, family atmosphere with plenty of individual attention.',
  'Professional childminder with Montessori training. My home is designed to encourage independence and natural learning through play.',
  'Experienced childminder with a focus on outdoor learning. We spend plenty of time in nature and local parks.',
  'Qualified childminder offering a bilingual environment. I speak both English and Irish fluently.',
  'Family-focused childminder with flexible hours. I understand the challenges of working parents and offer reliable, consistent care.',
  'Creative childminder with a background in arts education. I provide a stimulating environment with plenty of creative activities.',
  'Nurturing childminder with experience in early years education. I focus on developing social skills and emotional intelligence.',
  'Professional childminder with a background in child psychology. I provide a supportive environment for emotional development.',
  'Experienced childminder offering a structured daily routine. I believe in consistency and clear boundaries for children.',
  'Qualified childminder with a focus on healthy eating. I provide nutritious meals and teach children about good nutrition.',
  'Family-oriented childminder with a large, child-friendly garden. We spend lots of time outdoors in all weathers.',
  'Registered childminder with experience in special needs. I provide inclusive care for children of all abilities.',
  'Professional childminder offering a small group setting. I maintain a low child-to-adult ratio for individual attention.',
  'Experienced childminder with a background in music education. We enjoy daily music and movement activities.',
  'Qualified childminder providing a language-rich environment. I focus on developing strong communication skills.',
  'Family-focused childminder with flexible hours. I understand the needs of modern families and offer reliable care.',
  'Creative childminder with a passion for outdoor learning. We explore nature and the local environment daily.',
  'Professional childminder with experience in early intervention. I provide specialized support for children with additional needs.',
  'Experienced childminder offering a structured learning environment. I follow the Aistear curriculum framework.',
  'Qualified childminder with a focus on emotional development. I create a nurturing, supportive environment.',
  'Family-oriented childminder with a background in child development. I provide age-appropriate activities and care.',
  'Registered childminder offering a home-like setting. I focus on creating a warm, family atmosphere.',
  'Professional childminder with experience in special education. I provide inclusive care for all children.',
  'Experienced childminder with a focus on physical development. We enjoy daily outdoor activities and exercise.',
  'Qualified childminder offering a creative environment. I provide plenty of opportunities for artistic expression.',
  'Family-focused childminder with flexible hours. I understand the needs of working parents.',
  'Creative childminder with a passion for early learning. I provide a stimulating, educational environment.'
];

function generateAvailability() {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const schedule: Record<string, { startTime: string; endTime: string }> = {};
  
  // Generate realistic business hours
  days.forEach(day => {
    if (Math.random() > 0.1) { // 90% chance of being available on each day
      const startHour = ['07:00', '07:30', '08:00', '08:30'][Math.floor(Math.random() * 4)];
      const endHour = ['17:00', '17:30', '18:00', '18:30'][Math.floor(Math.random() * 4)];
      schedule[day] = {
        startTime: startHour,
        endTime: endHour,
      };
    }
  });

  return { schedule };
}

function generateCrecheCapacity() {
  // Generate total capacity between 20 and 50 children
  const totalSpaces = [20, 25, 30, 35, 40, 45, 50][Math.floor(Math.random() * 7)];
  
  // Generate age group capacities that sum up to totalSpaces
  const ageGroups = {
    '0-1': Math.floor(totalSpaces * 0.2), // 20% for infants
    '1-2': Math.floor(totalSpaces * 0.3), // 30% for toddlers
    '2-3': Math.floor(totalSpaces * 0.3), // 30% for pre-schoolers
    '3-4': Math.floor(totalSpaces * 0.2), // 20% for older pre-schoolers
  };
  
  // Adjust the last age group to ensure total matches
  const currentTotal = Object.values(ageGroups).reduce((sum, val) => sum + val, 0);
  ageGroups['3-4'] += (totalSpaces - currentTotal);
  
  // Generate available spaces for each age group (30-70% of capacity)
  const availableSpaces = {
    '0-1': Math.floor(ageGroups['0-1'] * (Math.random() * 0.4 + 0.3)),
    '1-2': Math.floor(ageGroups['1-2'] * (Math.random() * 0.4 + 0.3)),
    '2-3': Math.floor(ageGroups['2-3'] * (Math.random() * 0.4 + 0.3)),
    '3-4': Math.floor(ageGroups['3-4'] * (Math.random() * 0.4 + 0.3)),
  };
  
  // Calculate total available spaces
  const totalAvailableSpaces = Object.values(availableSpaces).reduce((sum, val) => sum + val, 0);
  
  return {
    totalSpaces,
    availableSpaces: totalAvailableSpaces,
    ageGroups,
    availableSpacesByAge: availableSpaces,
    staffToChildRatio: {
      '0-1': '1:3',
      '1-2': '1:4',
      '2-3': '1:6',
      '3-4': '1:8'
    },
    operatingHours: {
      monday: { start: '07:30', end: '18:00' },
      tuesday: { start: '07:30', end: '18:00' },
      wednesday: { start: '07:30', end: '18:00' },
      thursday: { start: '07:30', end: '18:00' },
      friday: { start: '07:30', end: '18:00' }
    }
  };
}

// Helper function to generate realistic coordinate variations
function generateCoordinateVariation(baseLat: number, baseLng: number): { lat: number; lng: number } {
  // Generate a random angle and distance
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * 0.005; // Max ~500m variation
  
  // Convert to lat/lng variations
  const latVariation = distance * Math.cos(angle);
  const lngVariation = distance * Math.sin(angle);
  
  return {
    lat: baseLat + latVariation,
    lng: baseLng + lngVariation
  };
}

async function main() {
  // Clear existing data
  await prisma.provider.deleteMany();

  // Create creches with precise coordinates
  for (let i = 0; i < CRECHE_NAMES.length; i++) {
    const location = DUBLIN_LOCATIONS[Math.floor(Math.random() * DUBLIN_LOCATIONS.length)];
    const coordinates = generateCoordinateVariation(location.lat, location.lng);

    await prisma.provider.create({
      data: {
        name: CRECHE_NAMES[i],
        email: `creche${i + 1}@example.com`,
        phone: `+353 ${Math.floor(Math.random() * 900000000) + 100000000}`,
        type: 'creche',
        address: `${location.name}, Dublin`,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        description: CRECHE_DESCRIPTIONS[i],
        experience: `${Math.floor(Math.random() * 10) + 1} years`,
        status: 'approved',
        hourlyRate: Math.floor(Math.random() * 10) + 15,
        availability: generateAvailability(),
        crecheCapacity: generateCrecheCapacity(),
      },
    });
  }

  // Create childminders with precise coordinates
  for (let i = 0; i < CHILDMINDER_NAMES.length; i++) {
    const location = DUBLIN_LOCATIONS[Math.floor(Math.random() * DUBLIN_LOCATIONS.length)];
    const coordinates = generateCoordinateVariation(location.lat, location.lng);

    await prisma.provider.create({
      data: {
        name: CHILDMINDER_NAMES[i],
        email: `childminder${i + 1}@example.com`,
        phone: `+353 ${Math.floor(Math.random() * 900000000) + 100000000}`,
        type: 'childminder',
        address: `${location.name}, Dublin`,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        description: CHILDMINDER_DESCRIPTIONS[i],
        experience: `${Math.floor(Math.random() * 15) + 1} years`,
        status: 'approved',
        hourlyRate: Math.floor(Math.random() * 5) + 8,
        availability: generateAvailability(),
      },
    });
  }

  console.log('✅ Seed data inserted successfully');
  console.log(`Created ${CRECHE_NAMES.length} creches and ${CHILDMINDER_NAMES.length} childminders`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 