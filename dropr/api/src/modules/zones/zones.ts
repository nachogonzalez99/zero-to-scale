import { type Coordinates, distanceInMeters } from '../../shared/geo.ts';

/**
 * Public API of the zones module. Other modules import from this file only.
 * Business rules: dropr/api/docs/spec.md.
 */
export interface Zone {
  id: string;
  name: string;
  center: Coordinates;
  radiusMeters: number;
  /** IANA time zone. Peak hours are evaluated in it. */
  timeZone: string;
  baseFeeCents: number;
  perKmCents: number;
  peakSurchargeCents: number;
  /** Orders of at least this amount get free delivery. */
  freeDeliveryFromCents: number;
}

const ZONE_DEFINITIONS: Zone[] = [
  {
    id: 'madrid',
    name: 'Madrid',
    center: { lat: 40.4168, lng: -3.7038 },
    radiusMeters: 8000,
    timeZone: 'Europe/Madrid',
    baseFeeCents: 199,
    perKmCents: 60,
    peakSurchargeCents: 100,
    freeDeliveryFromCents: 3000,
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    center: { lat: 41.3874, lng: 2.1686 },
    radiusMeters: 7000,
    timeZone: 'Europe/Madrid',
    baseFeeCents: 249,
    perKmCents: 70,
    peakSurchargeCents: 150,
    freeDeliveryFromCents: 3500,
  },
  {
    id: 'valencia',
    name: 'Valencia',
    center: { lat: 39.4699, lng: -0.3763 },
    radiusMeters: 6000,
    timeZone: 'Europe/Madrid',
    baseFeeCents: 149,
    perKmCents: 50,
    peakSurchargeCents: 100,
    freeDeliveryFromCents: 2500,
  },
];

function isValidTimeZone(timeZone: string): boolean {
  try {
    return new Intl.DateTimeFormat('en', { timeZone }).resolvedOptions().timeZone !== '';
  } catch {
    return false;
  }
}

/** Fails fast at startup if the zone configuration is inconsistent. */
export function validateZones(zones: readonly Zone[]): readonly Zone[] {
  const ids = new Set<string>();
  for (const zone of zones) {
    if (ids.has(zone.id)) {
      throw new Error(`Duplicate zone id: ${zone.id}`);
    }
    ids.add(zone.id);

    if (!isValidTimeZone(zone.timeZone)) {
      throw new Error(`Invalid time zone for zone ${zone.id}: ${zone.timeZone}`);
    }
  }

  for (const [index, zone] of zones.entries()) {
    for (const other of zones.slice(index + 1)) {
      if (distanceInMeters(zone.center, other.center) <= zone.radiusMeters + other.radiusMeters) {
        throw new Error(`Zones ${zone.id} and ${other.id} overlap`);
      }
    }
  }

  return zones;
}

export const ZONES = validateZones(ZONE_DEFINITIONS);

export function isWithinZone(zone: Zone, point: Coordinates): boolean {
  return distanceInMeters(zone.center, point) <= zone.radiusMeters;
}

export function findZoneById(id: string, zones: readonly Zone[] = ZONES): Zone | undefined {
  return zones.find((zone) => zone.id === id);
}

export function findZoneContaining(
  point: Coordinates,
  zones: readonly Zone[] = ZONES,
): Zone | undefined {
  return zones.find((zone) => isWithinZone(zone, point));
}
