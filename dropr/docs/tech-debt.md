# Tech Debt

| Owner | Status | Last reviewed |
| ----- | ------ | ------------- |
| CTO   | Active | 2026-10-29    |

Conscious shortcuts. Each entry says why it was accepted and when to revisit it. Remove an entry in the same pull request that resolves it.

## API key declared but not enforced

- **What:** The contract declares an `X-Api-Key` header and `401` responses, but no route checks it.
- **Why accepted:** The contract states the intended promise; enforcement belongs to the security work.
- **Risk:** Anyone can call the API. Must be fixed before any public deployment.
- **Review when:** Before the first deployment.

## Straight-line distance

- **What:** Distance is the straight line between pickup and dropoff, not the route a courier rides.
- **Why accepted:** No external dependency in Era 1.
- **Risk:** Underestimates real distance, especially across rivers, motorways or one-way streets. Prices are lower than the real cost.
- **Review when:** Pricing complaints from couriers or customers, or when a maps provider is integrated.

## Quotes are not stored

- **What:** Quotes return `quoteId` and `expiresAt`, but nothing is stored: a quote cannot be retrieved or validated later.
- **Why accepted:** No persistence in Era 1.
- **Risk:** Clients cannot prove the price they were offered; the fields promise something the API cannot keep.
- **Review when:** Orders are introduced (Era 2).

## Zones and prices live in code

- **What:** Zones and their prices are a constant in `dropr/api/src/modules/zones/zones.ts`.
- **Why accepted:** Three zones that rarely change; validated at startup.
- **Risk:** Changing a price needs a pull request and a deployment.
- **Review when:** Prices change more than once a month, or someone outside engineering needs to change them.
