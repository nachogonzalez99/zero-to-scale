import { z } from 'zod';

export const Coordinates = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .meta({ id: 'Coordinates' });

export const Zone = z
  .object({
    id: z.string(),
    name: z.string(),
    center: Coordinates,
    radiusMeters: z.number().int().min(1),
    baseFeeCents: z.number().int().min(0),
  })
  .meta({ id: 'Zone' });

export const ZoneList = z.object({ items: z.array(Zone) }).meta({ id: 'ZoneList' });

export const ZoneIdParams = z.object({
  zoneId: z.string().regex(/^[a-z0-9-]{1,32}$/),
});

export type Zone = z.infer<typeof Zone>;
