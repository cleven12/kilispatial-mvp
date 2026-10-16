import type { RouteId } from './kilispatial';

export interface ItineraryDay {
  day: number;
  title: string;
  fromPlace: string;
  toPlaceId: string;
  startAlt: number;
  endAlt: number;
  peakAlt?: number;
  distanceKm: number;
  hikingHours: string;
  zone: string;
  summary: string;
  highlights: string[];
}

export interface RoutePackage {
  id: RouteId;
  name: string;
  nickname: string;
  tagline: string;
  durationDays: number;
  totalDistanceKm: number;
  successRate: string;
  difficulty: 'Moderate' | 'Challenging' | 'Strenuous';
  accommodation: 'Mountain Huts' | 'Alpine Tents';
  startingPriceUsd: number;
  badge: string;
  days: ItineraryDay[];
}

export const KILIMANJARO_ROUTES: Record<string, RoutePackage> = {
  machame: {
    id: 'machame',
    name: '7-Day Machame Route',
    nickname: 'The Whiskey Route',
    tagline: 'Dramatic topography, diverse ecological zones, and the iconic Barranco Wall.',
    durationDays: 7,
    totalDistanceKm: 62,
    successRate: '85%+',
    difficulty: 'Challenging',
    accommodation: 'Alpine Tents',
    startingPriceUsd: 2190,
    badge: 'Most Popular',
    days: [
      {
        day: 1,
        title: 'Machame Gate to Machame Camp',
        fromPlace: 'machame-gate',
        toPlaceId: 'machame-camp',
        startAlt: 1811,
        endAlt: 3021,
        distanceKm: 11,
        hikingHours: '5–7 hrs',
        zone: 'Montane Rainforest',
        summary: 'Ascend steadily through lush primary rainforest canopy rich with Colobus monkeys and giant ferns.',
        highlights: ['Rainforest canopy trek', 'Colobus monkey sightings', 'First camp above cloud line']
      },
      {
        day: 2,
        title: 'Machame Camp to Shira Cave Camp',
        fromPlace: 'machame-camp',
        toPlaceId: 'shira-cave',
        startAlt: 3021,
        endAlt: 3839,
        distanceKm: 5,
        hikingHours: '4–6 hrs',
        zone: 'Moorland & Heather',
        summary: 'Leave the forest behind and climb a steep volcanic ridge onto the expansive Shira Plateau.',
        highlights: ['Giant lobelias & senecios', 'Views of Kibo & Mount Meru', 'Shira Volcanic Caldera']
      },
      {
        day: 3,
        title: 'Shira Cave to Lava Tower to Barranco Camp',
        fromPlace: 'shira-cave',
        toPlaceId: 'barranco-camp',
        startAlt: 3839,
        endAlt: 3976,
        peakAlt: 4630,
        distanceKm: 10,
        hikingHours: '6–8 hrs',
        zone: 'Alpine Desert',
        summary: 'Crucial acclimatization day. Climb high to the 4,630m Lava Tower volcanic plug before descending into the scenic Barranco Valley.',
        highlights: ['Climb High, Sleep Low protocol', 'Lava Tower (4,630m) lunch', 'Giant Groundsels forest']
      },
      {
        day: 4,
        title: 'Barranco Camp to Karanga Camp',
        fromPlace: 'barranco-camp',
        toPlaceId: 'karanga-camp',
        startAlt: 3976,
        endAlt: 3995,
        distanceKm: 5,
        hikingHours: '4–5 hrs',
        zone: 'Alpine Desert',
        summary: 'Scramble up the thrilling Barranco Wall ("Breakfast Wall") for sweeping views of the Heim Glacier before dropping into Karanga Valley.',
        highlights: ['Barranco Wall scramble', 'Kissing Rock passage', 'Heim Glacier vistas']
      },
      {
        day: 5,
        title: 'Karanga Camp to Barafu High Camp',
        fromPlace: 'karanga-camp',
        toPlaceId: 'barafu-camp',
        startAlt: 3995,
        endAlt: 4673,
        distanceKm: 4,
        hikingHours: '4–5 hrs',
        zone: 'High Alpine Desert',
        summary: 'Ascend an arid, windswept ridge to Barafu Base Camp. Early dinner and rest before the midnight summit bid.',
        highlights: ['Mawenzi Peak backdrop', 'Summit equipment check', 'Base camp at 4,673m']
      },
      {
        day: 6,
        title: 'Barafu Camp to Uhuru Peak & Down to Mweka Camp',
        fromPlace: 'barafu-camp',
        toPlaceId: 'uhuru-peak',
        startAlt: 4673,
        endAlt: 3080,
        peakAlt: 5895,
        distanceKm: 17,
        hikingHours: '11–14 hrs',
        zone: 'Arctic Summit Zone',
        summary: 'Midnight ascent up switchbacks to Stella Point (5,756m), continuing along the crater rim to sunrise at Uhuru Peak (5,895m).',
        highlights: ['Stella Point crater rim', 'Uhuru Peak (5,895m) Roof of Africa', 'Rebmann & Furtwängler Glaciers']
      },
      {
        day: 7,
        title: 'Mweka Camp to Mweka Gate',
        fromPlace: 'mweka-camp',
        toPlaceId: 'mweka-gate',
        startAlt: 3080,
        endAlt: 1640,
        distanceKm: 10,
        hikingHours: '3–4 hrs',
        zone: 'Rainforest Descent',
        summary: 'Final gentle descent through misty montane forest to Mweka Gate to collect your official gold summit certificates.',
        highlights: ['Summit certificate ceremony', 'Celebration with mountain crew', 'Transfer back to Moshi']
      }
    ]
  },
  lemosho: {
    id: 'lemosho',
    name: '8-Day Lemosho Route',
    nickname: 'The Wilderness Route',
    tagline: 'Remote western approach across the full Shira Plateau with the highest acclimatization profile.',
    durationDays: 8,
    totalDistanceKm: 70,
    successRate: '93%+',
    difficulty: 'Moderate',
    accommodation: 'Alpine Tents',
    startingPriceUsd: 2490,
    badge: 'Best Success Rate',
    days: [
      {
        day: 1,
        title: 'Londorossi Gate to Mti Mkubwa Camp',
        fromPlace: 'londorossi-gate',
        toPlaceId: 'mti-mkubwa',
        startAlt: 2100,
        endAlt: 2650,
        distanceKm: 6,
        hikingHours: '3–4 hrs',
        zone: 'Pristine Rainforest',
        summary: 'Begin on the quiet western slopes through untouched montane forest to Big Tree Camp.',
        highlights: ['Low crowd density', 'Untouched western flora', 'Podocarpus trees']
      },
      {
        day: 2,
        title: 'Mti Mkubwa to Shira 1 Camp',
        fromPlace: 'mti-mkubwa',
        toPlaceId: 'shira-1-camp',
        startAlt: 2650,
        endAlt: 3610,
        distanceKm: 8,
        hikingHours: '5–6 hrs',
        zone: 'Heather & Moorland',
        summary: 'Climb out of the forest and crest the Shira Ridge before descending gently onto the vast Shira Plateau.',
        highlights: ['First views of Kibo cone', 'Shira Caldera crossing', 'High-altitude heath']
      },
      {
        day: 3,
        title: 'Shira 1 Camp to Shira 2 Camp',
        fromPlace: 'shira-1-camp',
        toPlaceId: 'shira-2-camp',
        startAlt: 3610,
        endAlt: 3850,
        distanceKm: 7,
        hikingHours: '3–4 hrs',
        zone: 'High Moorland',
        summary: 'Gentle traverse across the plateau with optional acclimatization hike toward Shira Cathedral.',
        highlights: ['Shira Cathedral pinnacle', 'Panoramic sunset over Meru', 'Gentle elevation gain']
      },
      {
        day: 4,
        title: 'Shira 2 to Lava Tower to Barranco Camp',
        fromPlace: 'shira-2-camp',
        toPlaceId: 'barranco-camp',
        startAlt: 3850,
        endAlt: 3976,
        peakAlt: 4630,
        distanceKm: 10,
        hikingHours: '6–8 hrs',
        zone: 'Alpine Desert',
        summary: 'Merge with the southern circuit, ascending to Lava Tower (4,630m) before sleeping low in Barranco Valley.',
        highlights: ['Lava Tower acclimatization', 'Senecio forest canyon', 'Southern glacier views']
      },
      {
        day: 5,
        title: 'Barranco Camp to Karanga Camp',
        fromPlace: 'barranco-camp',
        toPlaceId: 'karanga-camp',
        startAlt: 3976,
        endAlt: 3995,
        distanceKm: 5,
        hikingHours: '4–5 hrs',
        zone: 'Alpine Desert',
        summary: 'Conquer the iconic Barranco Wall and traverse the ridges and valleys to Karanga Camp.',
        highlights: ['Barranco Wall scramble', 'Views of Kibo Southern Icefields', 'Rest afternoon']
      },
      {
        day: 6,
        title: 'Karanga Camp to Barafu Camp',
        fromPlace: 'karanga-camp',
        toPlaceId: 'barafu-camp',
        startAlt: 3995,
        endAlt: 4673,
        distanceKm: 4,
        hikingHours: '4–5 hrs',
        zone: 'High Alpine Desert',
        summary: 'Short, steady climb to Barafu High Camp. Prepare oxygen, thermal layers, and headlamps for summit night.',
        highlights: ['High altitude base camp', 'Mawenzi Peak sunset', 'Pre-summit briefing']
      },
      {
        day: 7,
        title: 'Barafu Camp to Uhuru Peak to Mweka Camp',
        fromPlace: 'barafu-camp',
        toPlaceId: 'uhuru-peak',
        startAlt: 4673,
        endAlt: 3080,
        peakAlt: 5895,
        distanceKm: 17,
        hikingHours: '11–14 hrs',
        zone: 'Arctic Summit Zone',
        summary: 'Reach the Roof of Africa at dawn, capture photos at the 5,895m sign, and descend to Mweka Camp.',
        highlights: ['Uhuru Peak (5,895m) sunrise', 'Glacier crater rim walk', 'Rapid oxygen recovery descent']
      },
      {
        day: 8,
        title: 'Mweka Camp to Mweka Gate',
        fromPlace: 'mweka-camp',
        toPlaceId: 'mweka-gate',
        startAlt: 3080,
        endAlt: 1640,
        distanceKm: 10,
        hikingHours: '3–4 hrs',
        zone: 'Montane Rainforest',
        summary: 'Descend to Mweka Gate for your summit certificates and hot lunch celebration.',
        highlights: ['Gold Summit Certificate', 'Crew tipping & song ceremony', 'Hotel transfer']
      }
    ]
  },
  marangu: {
    id: 'marangu',
    name: '6-Day Marangu Route',
    nickname: 'The Coca-Cola Route',
    tagline: 'The classic trail featuring permanent A-frame mountain huts and gentle gradients.',
    durationDays: 6,
    totalDistanceKm: 64,
    successRate: '75%+',
    difficulty: 'Moderate',
    accommodation: 'Mountain Huts',
    startingPriceUsd: 1890,
    badge: 'Hut Accommodation',
    days: [
      {
        day: 1,
        title: 'Marangu Gate to Mandara Hut',
        fromPlace: 'marangu-gate',
        toPlaceId: 'mandara-hut',
        startAlt: 1860,
        endAlt: 2700,
        distanceKm: 8,
        hikingHours: '4–5 hrs',
        zone: 'Rainforest',
        summary: 'Walk a well-maintained forest trail to Mandara A-frame huts and visit Maundi Crater.',
        highlights: ['Dormitory beds & solar power', 'Maundi Crater viewpoint', 'Blue monkey sightings']
      },
      {
        day: 2,
        title: 'Mandara Hut to Horombo Hut',
        fromPlace: 'mandara-hut',
        toPlaceId: 'horombo-hut',
        startAlt: 2700,
        endAlt: 3720,
        distanceKm: 12,
        hikingHours: '6–7 hrs',
        zone: 'Moorland',
        summary: 'Ascend through open moorland with clear views of both Mawenzi and Kibo peaks.',
        highlights: ['Twin peak vistas', 'Giant lobelia valleys', 'Bustling Horombo village huts']
      },
      {
        day: 3,
        title: 'Horombo Hut Acclimatization (Zebra Rocks)',
        fromPlace: 'horombo-hut',
        toPlaceId: 'zebra-rocks',
        startAlt: 3720,
        endAlt: 3720,
        peakAlt: 4020,
        distanceKm: 5,
        hikingHours: '3–4 hrs',
        zone: 'Moorland / Alpine',
        summary: 'Crucial extra day hiking to the striking black-and-white striped Zebra Rocks (4,020m) near the base of Mawenzi.',
        highlights: ['Zebra Rocks lava formations', 'Boosted red blood cell adaptation', 'Relaxed afternoon at Horombo']
      },
      {
        day: 4,
        title: 'Horombo Hut to Kibo Hut',
        fromPlace: 'horombo-hut',
        toPlaceId: 'kibo-hut',
        startAlt: 3720,
        endAlt: 4703,
        distanceKm: 10,
        hikingHours: '6–7 hrs',
        zone: 'Alpine Saddle Desert',
        summary: 'Cross the lunar saddle between Mawenzi and Kibo to reach the stone-built Kibo Hut.',
        highlights: ['The Alpine Saddle crossing', 'Stone dormitory at 4,703m', 'Early rest for midnight push']
      },
      {
        day: 5,
        title: 'Kibo Hut to Uhuru Peak to Horombo Hut',
        fromPlace: 'kibo-hut',
        toPlaceId: 'uhuru-peak',
        startAlt: 4703,
        endAlt: 3720,
        peakAlt: 5895,
        distanceKm: 21,
        hikingHours: '12–15 hrs',
        zone: 'Arctic Summit Zone',
        summary: 'Pass Hans Meyer Cave and Gilman’s Point (5,685m) before trekking along the snow-lined rim to Uhuru Peak.',
        highlights: ['Hans Meyer Cave (5,150m)', 'Gilman’s Point crater rim', 'Uhuru Peak (5,895m)']
      },
      {
        day: 6,
        title: 'Horombo Hut to Marangu Gate',
        fromPlace: 'horombo-hut',
        toPlaceId: 'marangu-gate',
        startAlt: 3720,
        endAlt: 1860,
        distanceKm: 20,
        hikingHours: '5–7 hrs',
        zone: 'Moorland to Rainforest',
        summary: 'Descend all the way back to Marangu Gate to sign out and receive your official TANAPA climbing certificate.',
        highlights: ['Final forest walk', 'Official summit diploma', 'Return to Moshi']
      }
    ]
  }
};
