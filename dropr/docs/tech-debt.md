# Tech Debt

| Owner | Status | Last reviewed |
| ----- | ------ | ------------- |

<<<<<<< HEAD
| CTO | Active | 2026-10-30 |
=======

| CTO | Active | 2026-10-29 |

> > > > > > > origin/main

Conscious shortcuts. Each entry says why it was accepted and when to revisit it. Remove an entry in the same pull request that resolves it.

## API key declared but not enforced

- **What:** The contract declares an `X-Api-Key` header and `401` responses, but no route checks it.
- **Why accepted:** The contract states the intended promise; enforcement belongs to the security work.
  <<<<<<< HEAD
- **Risk:** Anyone can call the API, including the deployed environments.
- # **Review when:** Before the first real client.
- **Risk:** Anyone can call the API. Must be fixed before any public deployment.
- **Review when:** Before the first deployment.
  > > > > > > > origin/main

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

## Health probes are public

- **What:** `/health/live` and `/health/ready` answer anyone, with version, commit and environment.
- **Why accepted:** Platforms and smoke tests need them, and they reveal nothing that is not in the public repository.
- **Risk:** Tells an attacker exactly which commit is running.
- **Review when:** The repository becomes private, or before the first real client.

## OpenTofu state is local

- **What:** `dropr/infra/github` keeps its state on the CTO's laptop.
- **Why accepted:** One person applies, and the state holds no secrets yet.
- **Risk:** Losing the laptop means importing again; two people applying at once would conflict.
- **Review when:** A second person applies, or a secret is managed in OpenTofu.

## Nobody is notified when CI fails

- **What:** A failing `main` or weekly run only shows in GitHub.
- **Why accepted:** One person, watching GitHub daily.
- **Risk:** A new vulnerability found on Monday can go unnoticed for days.
- **Review when:** With observability and alerting.

## Published images are never deleted

- **What:** Every merge publishes an image to GHCR; none is ever removed.
- **Why accepted:** Storage is not an issue yet.
- **Risk:** Growth without limit, and no rule about which images are rollback targets.
- **Review when:** With the production release flow.

## Images are not signed

- **What:** No signature, provenance attestation or SBOM is published with the image.
- **Why accepted:** Only our CI can push today, and nothing verifies yet.
- **Risk:** Anyone with write access to the registry could push an image tagged like ours.
- **Review when:** With the production release flow.
