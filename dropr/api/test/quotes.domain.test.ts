import { describe, expect, it } from 'vitest';
import {
  type QuoteInput,
  QUOTE_POLICY,
  calculateQuote,
} from '../src/modules/quotes/quotes.domain.ts';
import type { DomainErrorCode } from '../src/shared/errors.ts';
import { NOW, PLACES, madridTime } from './fixtures.ts';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const domainError = (code: DomainErrorCode): unknown =>
  expect.objectContaining({ name: 'DomainError', code });

/** Sol → Retiro (1,618 m) in Madrid, with the given overrides. */
const solToRetiro = (overrides: Partial<QuoteInput> = {}, now = NOW) =>
  calculateQuote(
    { pickup: PLACES.sol, dropoff: PLACES.retiro, orderAmountCents: 0, ...overrides },
    now,
  );

describe('calculateQuote: spec examples', () => {
  it.each([
    {
      example: 1,
      pickup: PLACES.sol,
      dropoff: PLACES.retiro,
      time: '11:00',
      order: 1500,
      distance: 1618,
      breakdown: {
        baseFeeCents: 199,
        distanceFeeCents: 97,
        peakSurchargeCents: 0,
        discountCents: 0,
      },
      total: 296,
    },
    {
      example: 2,
      pickup: PLACES.sol,
      dropoff: PLACES.bernabeu,
      time: '14:00',
      order: 2000,
      distance: 4226,
      breakdown: {
        baseFeeCents: 199,
        distanceFeeCents: 254,
        peakSurchargeCents: 100,
        discountCents: 0,
      },
      total: 553,
    },
    {
      example: 3,
      pickup: PLACES.retiro,
      dropoff: PLACES.vallecas,
      time: '21:00',
      order: 3500,
      distance: 3422,
      breakdown: {
        baseFeeCents: 199,
        distanceFeeCents: 205,
        peakSurchargeCents: 100,
        discountCents: 504,
      },
      total: 0,
    },
    {
      example: 4,
      pickup: PLACES.bernabeu,
      dropoff: PLACES.vallecas,
      time: '16:00',
      order: 1000,
      distance: 7271,
      breakdown: {
        baseFeeCents: 199,
        distanceFeeCents: 436,
        peakSurchargeCents: 0,
        discountCents: 0,
      },
      total: 635,
    },
  ])(
    'example $example: $total cents',
    ({ pickup, dropoff, time, order, distance, breakdown, total }) => {
      const quote = calculateQuote(
        { pickup, dropoff, orderAmountCents: order, deliveryAt: madridTime(time) },
        NOW,
      );

      expect(quote).toMatchObject({ zoneId: 'madrid', distanceMeters: distance, breakdown });
      expect(quote.totalCents).toBe(total);
    },
  );

  it('example 5: dropoff outside the zone', () => {
    expect(() =>
      calculateQuote({ pickup: PLACES.sol, dropoff: PLACES.getafe, orderAmountCents: 1500 }, NOW),
    ).toThrow(domainError('ZONE_NOT_COVERED'));
  });

  it('example 6: distance above the maximum', () => {
    expect(() =>
      calculateQuote(
        { pickup: PLACES.bernabeu, dropoff: PLACES.orcasur, orderAmountCents: 1500 },
        NOW,
      ),
    ).toThrow(domainError('DISTANCE_EXCEEDED'));
  });
});

describe('calculateQuote: zones', () => {
  it('rejects a pickup outside every zone', () => {
    expect(() =>
      calculateQuote({ pickup: PLACES.getafe, dropoff: PLACES.sol, orderAmountCents: 0 }, NOW),
    ).toThrow(domainError('ZONE_NOT_COVERED'));
  });

  it('rejects pickup and dropoff in different zones', () => {
    expect(() =>
      calculateQuote(
        { pickup: PLACES.sol, dropoff: PLACES.barcelonaCenter, orderAmountCents: 0 },
        NOW,
      ),
    ).toThrow(domainError('ZONE_NOT_COVERED'));
  });
});

describe('calculateQuote: distance', () => {
  it('allows exactly the maximum distance', () => {
    const quote = calculateQuote(
      { pickup: PLACES.edgeSouth, dropoff: PLACES.edgeNorthAt8000, orderAmountCents: 0 },
      NOW,
    );
    expect(quote.distanceMeters).toBe(QUOTE_POLICY.maxDistanceMeters);
  });

  it('rejects anything above the maximum distance', () => {
    expect(() =>
      calculateQuote(
        { pickup: PLACES.edgeSouth, dropoff: PLACES.edgeNorthAt8002, orderAmountCents: 0 },
        NOW,
      ),
    ).toThrow(domainError('DISTANCE_EXCEEDED'));
  });

  it('rounds the distance fee half up to the cent', () => {
    // 1,618 m × 60 / 1000 = 97.08 → 97
    const quote = calculateQuote(
      { pickup: PLACES.sol, dropoff: PLACES.retiro, orderAmountCents: 0 },
      NOW,
    );
    expect(quote.breakdown.distanceFeeCents).toBe(97);
  });
});

const peakSurchargeAt = (deliveryAt: Date, now = NOW) =>
  solToRetiro({ deliveryAt }, now).breakdown.peakSurchargeCents;

describe('calculateQuote: peak hours', () => {
  it.each([
    ['12:59', 0],
    ['13:00', 100],
    ['15:29', 100],
    ['15:30', 0],
    ['19:59', 0],
    ['20:00', 100],
    ['22:29', 100],
    ['22:30', 0],
  ])('at %s the surcharge is %i', (time, surcharge) => {
    expect(peakSurchargeAt(madridTime(time))).toBe(surcharge);
  });

  it('uses the zone time zone, not UTC', () => {
    // 12:00 UTC in summer is 14:00 in Madrid (UTC+02:00): peak.
    const summerNow = new Date('2026-07-01T08:00:00Z');
    expect(peakSurchargeAt(new Date('2026-07-01T12:00:00Z'), summerNow)).toBe(100);
  });
});

const discountFor = (orderAmountCents: number) =>
  solToRetiro({ orderAmountCents }).breakdown.discountCents;

describe('calculateQuote: free delivery', () => {
  it('starts exactly at the threshold', () => {
    expect(discountFor(2999)).toBe(0);
    expect(discountFor(3000)).toBe(296);
  });

  it('cancels the peak surcharge too', () => {
    const quote = calculateQuote(
      {
        pickup: PLACES.sol,
        dropoff: PLACES.retiro,
        orderAmountCents: 3000,
        deliveryAt: madridTime('14:00'),
      },
      NOW,
    );
    expect(quote.breakdown.peakSurchargeCents).toBe(100);
    expect(quote.totalCents).toBe(0);
  });
});

const quoteAt = (deliveryAt?: Date) => solToRetiro(deliveryAt ? { deliveryAt } : {});

describe('calculateQuote: delivery time', () => {
  it('defaults to now', () => {
    expect(quoteAt().deliveryAt).toEqual(NOW);
  });

  it('tolerates a small clock drift into the past', () => {
    expect(() => quoteAt(new Date(NOW.getTime() - 30_000))).not.toThrow();
  });

  it('rejects a time in the past', () => {
    expect(() => quoteAt(new Date(NOW.getTime() - 2 * MINUTE))).toThrow(
      domainError('INVALID_DELIVERY_TIME'),
    );
  });

  it('accepts up to 7 days ahead, and no more', () => {
    expect(() => quoteAt(new Date(NOW.getTime() + 7 * DAY))).not.toThrow();
    expect(() => quoteAt(new Date(NOW.getTime() + 7 * DAY + MINUTE))).toThrow(
      domainError('INVALID_DELIVERY_TIME'),
    );
  });

  it('expires 10 minutes after creation', () => {
    expect(quoteAt().expiresAt).toEqual(new Date(NOW.getTime() + 10 * MINUTE));
  });
});

describe('calculateQuote: invariants', () => {
  it('the total is always the breakdown minus the discount', () => {
    for (const [pickup, dropoff] of [
      [PLACES.sol, PLACES.retiro],
      [PLACES.sol, PLACES.bernabeu],
      [PLACES.bernabeu, PLACES.vallecas],
    ] as const) {
      for (const orderAmountCents of [0, 3000]) {
        for (const time of ['11:00', '14:00']) {
          const { breakdown, totalCents } = calculateQuote(
            { pickup, dropoff, orderAmountCents, deliveryAt: madridTime(time) },
            NOW,
          );
          expect(totalCents).toBe(
            breakdown.baseFeeCents +
              breakdown.distanceFeeCents +
              breakdown.peakSurchargeCents -
              breakdown.discountCents,
          );
        }
      }
    }
  });
});
