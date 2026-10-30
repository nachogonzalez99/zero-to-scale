import { z } from 'zod';
import { CoordinatesSchema } from '../../shared/geo.ts';

const cents = () => z.number().int().min(0);

export const ZoneSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    center: CoordinatesSchema,
    radiusMeters: z.number().int().min(1),
    timeZone: z.string().describe('IANA time zone used for peak hours.'),
    baseFeeCents: cents(),
    perKmCents: cents(),
    peakSurchargeCents: cents(),
    freeDeliveryFromCents: cents().describe('Orders of at least this amount get free delivery.'),
  })
  .meta({ id: 'Zone' });

export const ZoneListSchema = z.object({ items: z.array(ZoneSchema) }).meta({ id: 'ZoneList' });

export const ZoneIdParamsSchema = z.object({
  zoneId: z.string().regex(/^[a-z0-9-]{1,32}$/),
});
