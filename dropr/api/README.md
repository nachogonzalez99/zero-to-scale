# Dropr API

Delivery quotes for restaurants: how much a delivery costs before an order is confirmed.

- Business rules: [docs/spec.md](docs/spec.md)
- Contract: [contract/openapi.yaml](contract/openapi.yaml), generated from the code
- Live docs: http://localhost:3000/docs while running

## Run

```bash
pnpm dev     # reload on save
pnpm start   # plain start
```

| Variable              | Default     | Meaning                                                                  |
| --------------------- | ----------- | ------------------------------------------------------------------------ |
| `PORT`                | `3000`      | HTTP port                                                                |
| `APP_ENV`             | `local`     | Where it runs: `local`, `staging` or `production`                        |
| `LOG_LEVEL`           | `info`      | `fatal`, `error`, `warn`, `info`, `debug` or `trace`                     |
| `APP_VERSION`         | `0.0.0-dev` | Set by the image build                                                   |
| `APP_COMMIT`          | `unknown`   | Set by the image build                                                   |
| `SHUTDOWN_DRAIN_MS`   | `0`         | Keeps serving after readiness turns off, before closing                  |
| `SHUTDOWN_TIMEOUT_MS` | `8000`      | Max wait for in-flight requests. Drain + timeout < platform grace period |

Invalid values stop the API at startup.

## Run with Docker

From the repository root:

```bash
docker build -f dropr/api/Dockerfile -t dropr-api:local --build-arg COMMIT=$(git rev-parse HEAD) .
docker run --rm -p 3000:3000 dropr-api:local
```

| Build argument | Default     | Meaning                    |
| -------------- | ----------- | -------------------------- |
| `VERSION`      | `0.0.0-dev` | Release version, set by CI |
| `COMMIT`       | `unknown`   | Git commit, set by CI      |

The image runs as UID 1000, has no npm or pnpm, and stops cleanly on SIGTERM. CI builds, tests, scans and publishes it as `ghcr.io/<owner>/dropr-api:sha-<commit>`.

## Endpoints

| Method | Path                 | What it does                    |
| ------ | -------------------- | ------------------------------- |
| `POST` | `/v1/quotes`         | Calculates a delivery quote     |
| `GET`  | `/v1/zones`          | Lists coverage zones            |
| `GET`  | `/v1/zones/{zoneId}` | Returns one zone and its prices |

Health probes, for the platform and not part of the contract:

| Path            | Answers                                             |
| --------------- | --------------------------------------------------- |
| `/health/live`  | Is the process alive? Always `200` while it answers |
| `/health/ready` | Can it take traffic? `503` once shutdown starts     |

Both return `status`, `version`, `commit` and `environment`.

```bash
curl -s localhost:3000/v1/quotes \
  -H 'content-type: application/json' \
  -d '{"pickup":{"lat":40.4169,"lng":-3.7035},"dropoff":{"lat":40.4153,"lng":-3.6845},"orderAmountCents":1500}'
```

## Errors

Every error is an RFC 9457 problem (`application/problem+json`) with a stable `code`:

| Status | `code`                   | When                                                           |
| ------ | ------------------------ | -------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`       | The request does not match its schema. See `errors`            |
| 400    | `MALFORMED_REQUEST`      | The body is not valid JSON                                     |
| 404    | `NOT_FOUND`              | The route does not exist                                       |
| 404    | `ZONE_NOT_FOUND`         | The zone does not exist                                        |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | The body is not JSON                                           |
| 422    | `ZONE_NOT_COVERED`       | Pickup outside every zone, or dropoff outside its zone         |
| 422    | `DISTANCE_EXCEEDED`      | More than 8,000 m                                              |
| 422    | `INVALID_DELIVERY_TIME`  | In the past, or more than 7 days ahead                         |
| 500    | `INTERNAL_ERROR`         | Unexpected error. Details are in the logs, not in the response |

## Scripts

| Script      | What it does                                                   |
| ----------- | -------------------------------------------------------------- |
| `typecheck` | TypeScript                                                     |
| `test`      | Tests with coverage and thresholds                             |
| `contract`  | Regenerates and lints `contract/openapi.yaml`                  |
| `docs`      | Builds static API docs in `dist/api-docs.html`                 |
| `check`     | All of the above, and fails if the committed contract is stale |

## Structure

```
src/
├─ app.ts                  builds the Fastify app (used by tests and server)
├─ server.ts               starts listening, handles SIGTERM and SIGINT
├─ modules/
│  ├─ health/              health.schemas.ts · health.routes.ts
│  ├─ quotes/              quotes.domain.ts · quotes.schemas.ts · quotes.routes.ts
│  └─ zones/               zones.ts · zones.schemas.ts · zones.routes.ts
└─ shared/                 config, clock, errors, error handler, geo, readiness, responses, shutdown
test/                      <module>.domain.test.ts · <module>.http.test.ts
Dockerfile                 the image, built from the repository root
```

Domain files are pure: no HTTP, no clock, no randomness. Routes validate, call the domain and shape the response.
