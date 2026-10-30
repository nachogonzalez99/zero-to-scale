import { describe, expect, it } from 'vitest';
import { distanceInMeters } from '../src/shared/geo.ts';
import { PLACES } from './fixtures.ts';

describe('distanceInMeters', () => {
  it('is zero for the same point', () => {
    expect(distanceInMeters(PLACES.sol, PLACES.sol)).toBe(0);
  });

  it('returns the straight-line distance rounded to the meter', () => {
    expect(distanceInMeters(PLACES.sol, PLACES.retiro)).toBe(1618);
  });

  it('is symmetric', () => {
    expect(distanceInMeters(PLACES.retiro, PLACES.sol)).toBe(
      distanceInMeters(PLACES.sol, PLACES.retiro),
    );
  });
});
