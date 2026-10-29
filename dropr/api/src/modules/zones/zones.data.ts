import type { Zone } from './zones.schemas.ts';

export const zones: Zone[] = [
  {
    id: 'centro',
    name: 'Centro',
    center: { lat: 40.4168, lng: -3.7038 },
    radiusMeters: 3000,
    baseFeeCents: 199,
  },
];
