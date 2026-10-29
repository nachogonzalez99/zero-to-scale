import { describe, expect, it } from 'vitest';
import {
  ZONES,
  type Zone,
  findZoneById,
  findZoneContaining,
  validateZones,
} from '../src/modules/zones/zones.ts';
import { PLACES } from './fixtures.ts';

const zone = (overrides: Partial<Zone>): Zone => ({
  id: 'test',
  name: 'Test',
  center: { lat: 0, lng: 0 },
  radiusMeters: 1000,
  timeZone: 'UTC',
  baseFeeCents: 100,
  perKmCents: 10,
  peakSurchargeCents: 50,
  freeDeliveryFromCents: 1000,
  ...overrides,
});

describe('zone configuration', () => {
  it('is valid', () => {
    expect(() => validateZones(ZONES)).not.toThrow();
  });

  it('rejects duplicate ids', () => {
    expect(() => validateZones([zone({}), zone({ center: { lat: 10, lng: 10 } })])).toThrow(
      'Duplicate zone id: test',
    );
  });

  it('rejects unknown time zones', () => {
    expect(() => validateZones([zone({ timeZone: 'Mars/Olympus' })])).toThrow(
      'Invalid time zone for zone test',
    );
  });

  it('rejects overlapping zones', () => {
    const a = zone({ id: 'a' });
    const b = zone({ id: 'b', center: { lat: 0, lng: 0.01 } });
    expect(() => validateZones([a, b])).toThrow('Zones a and b overlap');
  });
});

describe('findZoneContaining', () => {
  it('finds the zone around a point', () => {
    expect(findZoneContaining(PLACES.sol)?.id).toBe('madrid');
    expect(findZoneContaining(PLACES.barcelonaCenter)?.id).toBe('barcelona');
  });

  it('returns nothing outside every zone', () => {
    expect(findZoneContaining(PLACES.getafe)).toBeUndefined();
  });
});

describe('findZoneById', () => {
  it('finds a zone by id, or nothing', () => {
    expect(findZoneById('valencia')?.name).toBe('Valencia');
    expect(findZoneById('paris')).toBeUndefined();
  });
});
