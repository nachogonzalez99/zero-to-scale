import { z } from 'zod';
import { CoordinatesSchema } from '../../shared/geo.ts';

const cents = () => z.number().int().min(0);

export const QuoteRequestSchema = z
  .strictObject({
    pickup: CoordinatesSchema.describe('Where the order is collected.'),
    dropoff: CoordinatesSchema.describe('Where the order is delivered.'),
    orderAmountCents: z.number().int().min(0).max(1_000_000),
    deliveryAt: z.iso
      .datetime({ offset: true })
      .optional()
      .describe('Requested delivery time, with offset. Defaults to now.'),
  })
  .meta({ id: 'QuoteRequest' });

const QuoteBreakdownSchema = z
  .object({
    baseFeeCents: cents(),
    distanceFeeCents: cents(),
    peakSurchargeCents: cents(),
    discountCents: cents(),
  })
  .meta({ id: 'QuoteBreakdown' });

export const QuoteSchema = z
  .object({
    quoteId: z.uuid(),
    zoneId: z.string(),
    distanceMeters: z.number().int().min(0),
    breakdown: QuoteBreakdownSchema,
    totalCents: cents().describe('Base + distance + peak surcharge − discount.'),
    currency: z.literal('EUR'),
    deliveryAt: z.iso.datetime().describe('Delivery time used for the quote, in UTC.'),
    expiresAt: z.iso.datetime().describe('The quote is valid until this time, in UTC.'),
  })
  .meta({ id: 'Quote' });
