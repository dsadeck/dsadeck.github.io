# Contributing to Grindspace

## Local setup

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest
npm run lint
```

## Design decisions

Before writing non-trivial code, read [`CONTEXT.md`](./CONTEXT.md) and skim [`docs/adr/`](./docs/adr). The vocabulary is intentionally precise: please avoid introducing aliases (e.g. don't say `Card` when you mean `Problem`).

For any decision that meets all three criteria — **hard to reverse, surprising without context, the result of a real trade-off** — please open an ADR in `docs/adr/` numbered sequentially. Keep it short.

## Tests

The scheduler (`src/sr/scheduler.ts`) and session engine (`src/sr/sessionEngine.ts`) are the heart of the app and are pure functions. Any change to them must come with a test.

## No telemetry

Grindspace is intentionally telemetry-free. Please don't add analytics, tracking, or any code that phones home.
