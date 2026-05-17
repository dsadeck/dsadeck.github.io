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

## Privacy

Grindspace uses [GoatCounter](https://www.goatcounter.com/) for aggregate, cookieless, IP-hashing pageview analytics. That is the **only** thing that phones home, and it stays that way. Please don't introduce:

- Per-user identifiers, accounts, or any way to correlate two visits as the same person
- Third-party trackers, ad networks, or fingerprinting libraries
- Anything that uploads a user's progress, notes, code, or ratings — those are deliberately device-local
- Heavyweight analytics SDKs (Google Analytics, Mixpanel, Amplitude, Segment, …) — the existing GoatCounter snippet is ~3 KB, ad-free, and fast on mobile; that's the bar

If you need a new metric, prefer a custom GoatCounter event over installing another vendor.
