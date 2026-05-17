# Grindspace

Spaced repetition for the [NeetCode 150](https://neetcode.io/practice/practice/neetcode150). All progress lives in your browser's `localStorage` — no accounts, no backend, no telemetry. Open-source under MIT, designed to be forked and self-hosted.

> Status: early — see [`docs/adr/`](./docs/adr) for the decisions that shaped it and `.cursor/plans/` for the full design plan.

## Why

LeetCode grinding has one consistent failure mode: you solve a problem, feel good, and then have no idea how to do it three weeks later. Grindspace fixes that with a 4-button Leitner+ spaced-repetition scheduler tuned for DSA, not vocabulary.

## Features

- 4-button rating (Again / Hard / Good / Easy) with fixed intervals (1, 3, 7, 16, 35 days) + 90-day mastery refresh
- Honest mastery — "mastered" problems still resurface every 90 days so the label doesn't lie
- End-of-session re-show: failed problems come back later the same session, with `good`/`easy` recoveries capped at `hard` to keep the SR signal honest
- Topic drill mode — grind a single NeetCode topic before an interview
- "Random weak spot" picker — surfaces your weakest problem when you can't decide what to do
- Per-attempt code snippets with syntax highlighting — the app doubles as a personal cheat-sheet
- PWA / installable / offline
- Dark mode (defaults to system)

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

## Deploy

Hosted at <https://dsadeck.github.io> (GitHub Pages org site, served from root):

```bash
npm run deploy
```

This builds, generates a `404.html` SPA fallback so deep links survive a hard
reload, drops a `.nojekyll` so GitHub Pages doesn't run Jekyll on the output,
and pushes `dist/` to the `gh-pages` branch of the configured `origin`. Make
sure your repo's Pages source is set to **Branch: `gh-pages` / `/`** in
**Settings → Pages**.

For a project-page deployment under `/<repo>/` (e.g. forks), set
`GRINDSPACE_BASE`:

```bash
GRINDSPACE_BASE=/grindspace/ npm run build
```

## Use a different problem list

Replace [`src/data/problems.json`](./src/data/problems.json) with your own list following the same shape:

```json
{
  "version": "YYYY-MM-DD",
  "problems": [
    {
      "id": "stable-slug",
      "title": "Display Title",
      "topic": "Topic Name",
      "difficulty": "Easy" | "Medium" | "Hard",
      "leetcodeUrl": "https://..."
    }
  ]
}
```

`id` is a stable slug — keep it constant even if you rename a problem; the user's progress is keyed by it.

## How spaced repetition works here

See [`docs/adr/0002-leitner-over-sm2-fsrs.md`](./docs/adr/0002-leitner-over-sm2-fsrs.md) for why we picked Leitner+ over Anki's SM-2 / FSRS, and [`docs/adr/0001-mastery-refresh-interval.md`](./docs/adr/0001-mastery-refresh-interval.md) for the mastery semantics.

## Docs

- [`CONTEXT.md`](./CONTEXT.md) — domain glossary (Problem, Attempt, Mastered, Session, Recovered Attempt)
- [`docs/adr/`](./docs/adr) — architectural decision records
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — how to work on the codebase

## License

MIT — see [LICENSE](./LICENSE).
