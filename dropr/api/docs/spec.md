# Delivery Quotes · Domain Specification

| Owner | Status   | Last reviewed |
| ----- | -------- | ------------- |
| CTO   | Accepted | 2026-10-29    |

## Purpose

Restaurants call Dropr before confirming an order to know how much the delivery will cost. Dropr answers with a price and a breakdown. Nothing is stored: a quote is a pure calculation.

## Concepts

- **Zone**: an area where Dropr operates, modelled as a circle (center and radius). Today, one zone per city.
- **Pickup**: where the order is collected (the restaurant).
- **Dropoff**: where it is delivered (the customer).
- **Quote**: the calculated price for one delivery, valid for a short time.

All amounts are **integer cents in EUR**. Distances are **integer meters**.

## Zones

| Zone        | Center (lat, lng) | Radius  | Time zone     | Base fee | Per km | Peak surcharge | Free delivery from |
| ----------- | ----------------- | ------- | ------------- | -------- | ------ | -------------- | ------------------ |
| `madrid`    | 40.4168, -3.7038  | 8,000 m | Europe/Madrid | 199      | 60     | 100            | 3,000              |
| `barcelona` | 41.3874, 2.1686   | 7,000 m | Europe/Madrid | 249      | 70     | 150            | 3,500              |
| `valencia`  | 39.4699, -0.3763  | 6,000 m | Europe/Madrid | 149      | 50     | 100            | 2,500              |

Zones are configuration, validated at startup. Zones must not overlap.

## Input

| Field              | Type                           | Rules                                |
| ------------------ | ------------------------------ | ------------------------------------ |
| `pickup`           | `{ lat, lng }`                 | lat in [-90, 90], lng in [-180, 180] |
| `dropoff`          | `{ lat, lng }`                 | Same                                 |
| `orderAmountCents` | integer                        | 0 to 1,000,000                       |
| `deliveryAt`       | ISO 8601 date-time with offset | Optional. Defaults to now            |

Unknown fields are rejected, so a typo (`orderAmount`) fails instead of being ignored.

## Calculation

1. **Zone**: the zone that contains the pickup. The dropoff must be in the **same** zone.
2. **Delivery time**: `deliveryAt` (or now) must be between now and 7 days from now. Up to 1 minute in the past is tolerated, to absorb clock drift between client and server.
3. **Distance**: straight-line (haversine) distance between pickup and dropoff, rounded to the nearest meter. Maximum 8,000 m.
4. **Base fee**: the zone's base fee.
5. **Distance fee**: `distanceMeters × perKmCents / 1000`, rounded half up to the nearest cent.
6. **Peak surcharge**: the zone's surcharge if the delivery time, **in the zone's time zone**, is within 13:00–15:30 or 20:00–22:30.
7. **Subtotal**: base fee + distance fee + peak surcharge.
8. **Free delivery**: if `orderAmountCents` reaches the zone's threshold, the discount equals the subtotal. Otherwise, no discount.
9. **Total**: subtotal − discount.

## Output

| Field            | Description                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| `quoteId`        | Random UUID                                                               |
| `zoneId`         | Zone used                                                                 |
| `distanceMeters` | Step 3                                                                    |
| `breakdown`      | `baseFeeCents`, `distanceFeeCents`, `peakSurchargeCents`, `discountCents` |
| `totalCents`     | Step 9. Always equals the sum of the breakdown minus the discount         |
| `currency`       | `EUR`                                                                     |
| `deliveryAt`     | The delivery time used, in UTC                                            |
| `expiresAt`      | 10 minutes after the quote is created, in UTC                             |

## Errors

| Code                    | HTTP | When                                                                  |
| ----------------------- | ---- | --------------------------------------------------------------------- |
| `VALIDATION_ERROR`      | 400  | The input does not follow the rules above                             |
| `ZONE_NOT_COVERED`      | 422  | The pickup is in no zone, or the dropoff is outside the pickup's zone |
| `DISTANCE_EXCEEDED`     | 422  | Distance above 8,000 m                                                |
| `INVALID_DELIVERY_TIME` | 422  | `deliveryAt` in the past or more than 7 days ahead                    |

## Decisions

| #   | Question                                      | Decision                                                                                                                                              | Why                                                                                                       |
| --- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| D1  | Which time zone defines peak hours?           | The zone's time zone                                                                                                                                  | Lunch time is local. Using UTC would move peak hours twice a year                                         |
| D2  | Pickup and dropoff in different zones?        | Rejected (`ZONE_NOT_COVERED`)                                                                                                                         | Couriers work within one zone. Today zones are cities, so it only happens outside coverage                |
| D3  | Are limits inclusive?                         | 8,000 m is allowed; a threshold reached exactly gives free delivery; peak windows include the start and exclude the end (13:00 is peak, 15:30 is not) | One explicit rule per limit, so tests can check the edges                                                 |
| D4  | How is the distance fee rounded?              | Proportional to meters, rounded half up to the cent                                                                                                   | Fair to the customer and simple to explain. Per-started-kilometer pricing is a pricing decision for later |
| D5  | Does free delivery cancel the peak surcharge? | Yes: the whole subtotal                                                                                                                               | "Free delivery" must mean 0 to the customer                                                               |
| D6  | Straight-line or route distance?              | Straight line                                                                                                                                         | No external dependency in Era 1. Route distance needs a maps provider (→ tech debt)                       |
| D7  | How far ahead can a delivery be quoted?       | Up to 7 days; never in the past, with 1 minute of tolerance                                                                                           | Prices may change; a long horizon makes quotes unreliable. The tolerance covers client clock drift        |
| D8  | Are quotes stored?                            | No: `quoteId` and `expiresAt` are returned but nothing can be retrieved or checked later                                                              | No persistence in Era 1 (→ tech debt)                                                                     |
| D9  | Minimum and maximum price?                    | None                                                                                                                                                  | The base fee is the floor and the 8 km limit bounds the top. Fewer rules, fewer edge cases                |

## Examples

Madrid, quote created on 2026-11-02 at 10:00 Madrid time (UTC+01:00).

| #   | Pickup → Dropoff    | Distance | Delivery | Order | Base                                        | Distance fee | Peak | Discount | Total   |
| --- | ------------------- | -------- | -------- | ----- | ------------------------------------------- | ------------ | ---- | -------- | ------- |
| 1   | Sol → Retiro        | 1,618 m  | 11:00    | 1,500 | 199                                         | 97           | 0    | 0        | **296** |
| 2   | Sol → Bernabéu      | 4,226 m  | 14:00    | 2,000 | 199                                         | 254          | 100  | 0        | **553** |
| 3   | Retiro → Vallecas   | 3,422 m  | 21:00    | 3,500 | 199                                         | 205          | 100  | 504      | **0**   |
| 4   | Bernabéu → Vallecas | 7,271 m  | 16:00    | 1,000 | 199                                         | 436          | 0    | 0        | **635** |
| 5   | Sol → Getafe        | 12,613 m | 11:00    | 1,500 | `ZONE_NOT_COVERED` (dropoff outside Madrid) |
| 6   | Bernabéu → Orcasur  | 9,005 m  | 11:00    | 1,500 | `DISTANCE_EXCEEDED`                         |

Coordinates: Sol (40.4169, -3.7035) · Retiro (40.4153, -3.6845) · Bernabéu (40.4531, -3.6883) · Vallecas (40.3918, -3.6584) · Getafe (40.3057, -3.7329) · Orcasur (40.3730, -3.7040).

Edge cases: delivery at exactly 13:00 (peak) and 15:30 (not peak); order exactly at the threshold (free); distance exactly 8,000 m (allowed).

Every example and edge case is an automated test in `test/quotes.domain.test.ts`. If a rule changes, the spec and the tests change in the same pull request.
