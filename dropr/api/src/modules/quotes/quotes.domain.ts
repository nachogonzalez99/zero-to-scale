import { DomainError } from '../../shared/errors.ts';
import { type Coordinates, distanceInMeters } from '../../shared/geo.ts';
import { ZONES, type Zone, findZoneContaining, isWithinZone } from '../zones/zones.ts';

/** Business rules: dropr/api/docs/spec.md. */
export const QUOTE_POLICY = {
  maxDistanceMeters: 8000,
  maxDaysAhead: 7,
  /** A `deliveryAt` slightly in the past is accepted, to absorb client clock drift. */
  clockSkewToleranceMs: 60_000,
  validityMs: 10 * 60_000,
  /** Local time windows, in minutes since midnight. Start included, end excluded. */
  peakWindows: [
    { from: 13 * 60, to: 15 * 60 + 30 },
    { from: 20 * 60, to: 22 * 60 + 30 },
  ],
} as const;

const DAY_MS = 24 * 60 * 60_000;

export interface QuoteInput {
  pickup: Coordinates;
  dropoff: Coordinates;
  orderAmountCents: number;
  /** Defaults to `now`. */
  deliveryAt?: Date;
}

interface QuoteBreakdown {
  baseFeeCents: number;
  distanceFeeCents: number;
  peakSurchargeCents: number;
  discountCents: number;
}

export interface CalculatedQuote {
  zoneId: string;
  distanceMeters: number;
  breakdown: QuoteBreakdown;
  totalCents: number;
  deliveryAt: Date;
  expiresAt: Date;
}

const localTimeFormatters = new Map<string, Intl.DateTimeFormat>();

function minutesSinceMidnight(date: Date, timeZone: string): number {
  let formatter = localTimeFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    localTimeFormatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  return hour * 60 + minute;
}

function isPeakTime(date: Date, timeZone: string): boolean {
  const minutes = minutesSinceMidnight(date, timeZone);
  return QUOTE_POLICY.peakWindows.some(({ from, to }) => minutes >= from && minutes < to);
}

function resolveZone(pickup: Coordinates, dropoff: Coordinates, zones: readonly Zone[]): Zone {
  const zone = findZoneContaining(pickup, zones);
  if (!zone) {
    throw new DomainError(
      'ZONE_NOT_COVERED',
      'The pickup location is outside every delivery zone.',
    );
  }
  if (!isWithinZone(zone, dropoff)) {
    throw new DomainError(
      'ZONE_NOT_COVERED',
      `The dropoff location is outside the ${zone.name} delivery zone.`,
    );
  }
  return zone;
}

function assertDeliveryTime(deliveryAt: Date, now: Date): void {
  const earliest = now.getTime() - QUOTE_POLICY.clockSkewToleranceMs;
  const latest = now.getTime() + QUOTE_POLICY.maxDaysAhead * DAY_MS;
  if (deliveryAt.getTime() < earliest) {
    throw new DomainError('INVALID_DELIVERY_TIME', 'The delivery time is in the past.');
  }
  if (deliveryAt.getTime() > latest) {
    throw new DomainError(
      'INVALID_DELIVERY_TIME',
      `The delivery time is more than ${QUOTE_POLICY.maxDaysAhead} days ahead.`,
    );
  }
}

/** Proportional to meters, rounded half up to the cent, in integer arithmetic. */
function distanceFee(distanceMeters: number, perKmCents: number): number {
  return Math.floor((distanceMeters * perKmCents + 500) / 1000);
}

/** Pure calculation: same input and `now`, same result. */
export function calculateQuote(
  input: QuoteInput,
  now: Date,
  zones: readonly Zone[] = ZONES,
): CalculatedQuote {
  const zone = resolveZone(input.pickup, input.dropoff, zones);

  const deliveryAt = input.deliveryAt ?? now;
  assertDeliveryTime(deliveryAt, now);

  const distanceMeters = distanceInMeters(input.pickup, input.dropoff);
  if (distanceMeters > QUOTE_POLICY.maxDistanceMeters) {
    throw new DomainError(
      'DISTANCE_EXCEEDED',
      `The distance is ${distanceMeters} m; the maximum is ${QUOTE_POLICY.maxDistanceMeters} m.`,
    );
  }

  const baseFeeCents = zone.baseFeeCents;
  const distanceFeeCents = distanceFee(distanceMeters, zone.perKmCents);
  const peakSurchargeCents = isPeakTime(deliveryAt, zone.timeZone) ? zone.peakSurchargeCents : 0;
  const subtotalCents = baseFeeCents + distanceFeeCents + peakSurchargeCents;
  const discountCents = input.orderAmountCents >= zone.freeDeliveryFromCents ? subtotalCents : 0;

  return {
    zoneId: zone.id,
    distanceMeters,
    breakdown: { baseFeeCents, distanceFeeCents, peakSurchargeCents, discountCents },
    totalCents: subtotalCents - discountCents,
    deliveryAt,
    expiresAt: new Date(now.getTime() + QUOTE_POLICY.validityMs),
  };
}
