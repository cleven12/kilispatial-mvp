import placesData from '../data/places.json';
import machameRoute from '../data/routes/machame.json';
import lemoshoRoute from '../data/routes/lemosho.json';
import maranguRoute from '../data/routes/marangu.json';

export interface Place {
  id: string;
  name: string;
  kind: string;
  coordinates: [number, number]; // [lng, lat]
  elevation: number;
}

export interface RouteDay {
  day: number;
  from: string;
  to: string;
  title: string;
  startKm: number;
  endKm: number;
  distanceKm: number;
  startElevation: number;
  endElevation: number;
}

export interface RouteData {
  id: string;
  name: string;
  days: RouteDay[];
  coordinates: [number, number, number][]; // [lng, lat, elevation]
  marks: Array<{ place: string; km: number; kind: string }>;
}

export const BUILTIN_ROUTES: Record<string, RouteData> = {
  machame: machameRoute as unknown as RouteData,
  lemosho: lemoshoRoute as unknown as RouteData,
  marangu: maranguRoute as unknown as RouteData
};

export const BUILTIN_PLACES: Place[] = placesData as unknown as Place[];

export const KILIMANJARO_SUMMIT: [number, number] = [37.354, -3.07641]; // Uhuru Peak [lng, lat]

export const PLACE_ALIASES: Record<string, string> = {
  'londorossi-gate': 'lemosho-gate',
  'mti-mkubwa': 'big-tree-camp',
  'shira-1-camp': 'shira-1',
  'shira-2-camp': 'shira-2',
  'shira-cave': 'shira-cave',
  'zebra-rocks': 'horombo-hut'
};

/**
 * Calculates Great-Circle distance between two coordinates in kilometers using Haversine formula
 */
export function haversineKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculates initial bearing from point 1 to point 2 in degrees [-180, 180]
 */
export function calculateBearing(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

/**
 * Bearing from any point on Kilimanjaro towards Uhuru Peak for cinematic 3D perspective
 */
export function getBearingTowardsPeak(lon: number, lat: number): number {
  return calculateBearing(lon, lat, KILIMANJARO_SUMMIT[0], KILIMANJARO_SUMMIT[1]);
}

/**
 * Slices route coordinates for a specific stage/day based on startKm and endKm
 */
export function extractStageCoordinates(
  coordinates: [number, number, number][],
  startKm: number,
  endKm: number
): [number, number, number][] {
  if (!coordinates || coordinates.length === 0) return [];
  if (coordinates.length === 1) return coordinates;

  const cumDists: number[] = [0];
  let cum = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    cum += haversineKm(prev[0], prev[1], curr[0], curr[1]);
    cumDists.push(cum);
  }

  let startIdx = 0;
  let endIdx = coordinates.length - 1;

  for (let i = 0; i < cumDists.length; i++) {
    if (cumDists[i] <= startKm) startIdx = i;
    if (cumDists[i] <= endKm) endIdx = i;
  }

  if (endIdx < coordinates.length - 1) {
    endIdx++; // include next point for seamless connectivity
  }

  const result = coordinates.slice(startIdx, endIdx + 1);
  return result.length > 0 ? result : coordinates;
}

/**
 * Computes bounding box [[minLng, minLat], [maxLng, maxLat]] for a coordinate list
 */
export function getCoordinatesBounds(
  coords: [number, number, number][] | [number, number][]
): [[number, number], [number, number]] | null {
  if (!coords || coords.length === 0) return null;
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const c of coords) {
    if (c[0] < minLng) minLng = c[0];
    if (c[0] > maxLng) maxLng = c[0];
    if (c[1] < minLat) minLat = c[1];
    if (c[1] > maxLat) maxLat = c[1];
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat]
  ];
}
