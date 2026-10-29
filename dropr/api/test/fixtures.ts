import type { Coordinates } from '../src/shared/geo.ts';

/** Places used in dropr/api/docs/spec.md, plus points for edge cases. */
export const PLACES = {
  sol: { lat: 40.4169, lng: -3.7035 },
  retiro: { lat: 40.4153, lng: -3.6845 },
  bernabeu: { lat: 40.4531, lng: -3.6883 },
  vallecas: { lat: 40.3918, lng: -3.6584 },
  getafe: { lat: 40.3057, lng: -3.7329 },
  orcasur: { lat: 40.373, lng: -3.704 },
  barcelonaCenter: { lat: 41.3874, lng: 2.1686 },
  /** 8,000 m from `edgeSouth`: the maximum allowed distance. */
  edgeSouth: { lat: 40.3808, lng: -3.7038 },
  edgeNorthAt8000: { lat: 40.45275, lng: -3.7038 },
  edgeNorthAt8002: { lat: 40.45276, lng: -3.7038 },
} satisfies Record<string, Coordinates>;

/** Quote creation time used in the spec examples: 2026-11-02 10:00 in Madrid (UTC+01:00). */
export const NOW = new Date('2026-11-02T10:00:00+01:00');

/** A Madrid local time on the day of `NOW`. */
export const madridTime = (time: string): Date => new Date(`2026-11-02T${time}:00+01:00`);
