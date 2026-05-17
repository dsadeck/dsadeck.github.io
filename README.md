# Grindspace

> **Live: <https://dsadeck.github.io>** — open it, it works.

Grindspace is a spaced-repetition trainer for the [NeetCode 150](https://neetcode.io/practice/practice/neetcode150). Solve a Problem, rate how it went, and Grindspace decides when to show it to you next so you actually retain it instead of re-solving the same problems forever.

All progress lives in your browser's `localStorage` — no accounts, no backend, no per-user tracking. Your ratings, notes, and code never leave your device. The site uses [GoatCounter](https://www.goatcounter.com/) for anonymous aggregate pageview counts (no cookies, hashed IPs); see [Privacy](#privacy). Open-source under MIT, designed to be forked and self-hosted.

## Why

LeetCode grinding has one consistent failure mode: you solve a problem, feel good, and then have no idea how to do it three weeks later. Grindspace fixes that with a 4-button Leitner+ spaced-repetition scheduler tuned for DSA, not vocabulary.

## How to use it

Open <https://dsadeck.github.io>. There's nothing to install — though you can install it as a PWA (Add to Home Screen on mobile, "Install" in Chrome / Edge / Safari) for offline use.

### 1. Today

The home page shows what's **due** (red), what's **new** (blue), and your **mastery** progress. Two buttons:

- **Start session** — works through the queue: due Problems oldest-first, then today's `dailyNewLimit` new Problems.
- **Random weak spot** — picks the Problem you're worst at, weighted by `again` count, difficulty, and overdueness. Good for "I want to grind something but don't know what."

A "Due by topic" breakdown helps you triage — three Trees due is different from three Bit Manipulation due.

### 2. Session flow

For each Problem in the queue:

1. The app shows you the title + LeetCode link. Solve it on LeetCode (or in your editor — Grindspace doesn't care where).
2. Come back, click **I'm done — rate it** (or press `Space`).
3. Pick a rating: **Again / Hard / Good / Easy** (or press `1` `2` `3` `4`).
4. Optionally log your time, jot a note, or paste your solution. Code snippets are syntax-highlighted and the app doubles as a personal cheat-sheet — you'll see your last note + last solution every time the Problem comes back.
5. Press `Enter` (or click **Save & next**) to advance.

#### Keyboard shortcuts on the Session page

| Key | Action |
|---|---|
| `Space` | reveal the rating form |
| `1` `2` `3` `4` | select Again / Hard / Good / Easy |
| `Enter` | save & advance to next Problem |
| `Esc` | collapse the form |

### 3. Ratings & intervals

Fixed Leitner-style box intervals. No fuzzing, no "ease factor" — what you click is what you get.

| Rating | Effect on box | Next due |
|---|---|---|
| **Again** | drop to box 1 | 1 day |
| **Hard** | stay in current box | (re-uses current interval) |
| **Good** | +1 box | 1 / 3 / 7 / 16 / 35 days |
| **Easy** | +2 boxes | 1 / 3 / 7 / 16 / 35 days |

A Problem reaches **mastery** when it lands in box 5 with two consecutive non-drill `easy` ratings. **Mastered Problems still resurface every 90 days** — saying "mastered" should be honest, not aspirational.

If you tank a Problem (`again`) and re-attempt it later in the **same Session**, the recovery is **capped at Hard** even if you click `easy`. This is a feature, not a bug — see [ADR 0003](./docs/adr/0003-end-of-session-recovery-cap.md). The original rating is preserved on the Attempt record, just not propagated to the scheduler.

### 4. Catalog

Browse all 150 Problems grouped by Topic, with status (new / learning / reviewing / mastered / suspended) and difficulty pills. Search by title / topic / pattern, filter by status or difficulty.

- Click any Problem **title** → its per-Problem detail page (history, stats, actions).
- Click the **`↗`** icon → opens the LeetCode page in a new tab.
- Click **Drill topic** on a topic header → starts a Drill (see below).

### 5. Per-Problem page (`/problem/:id`)

Everything Grindspace knows about one Problem:

- **Header**: title, difficulty, status, current box.
- **Stats**: next due, total attempts, count of `again`s, average time per attempt.
- **Attempt history** — most-recent-first. Each attempt shows the rating, source (Due / Drill / Practice / Weak spot), relative + absolute timestamp, time-in-minutes, a "used hints" indicator, and collapsible notes + syntax-highlighted solution. Capped recoveries are shown with both the clicked rating and the SR-effective rating, with a tooltip explaining why.
- **Actions**: Practice now, Open on LeetCode, Suspend (hide from queues), Reset progress (two-click confirm).

### 6. Drill mode

On the Catalog, click **Drill topic** on any topic header to grind every non-suspended, non-mastered Problem in that topic, weakest-first (lowest box, then longest-since-last-attempt). Useful for cramming a single pattern before an interview.

By default Drill ratings advance the SR scheduler like normal Sessions, but they can never *grant* mastery (only non-drill `easy` × 2 can). You can toggle "Drill updates SR" off in Settings to turn Drill into pure practice that logs Attempts without changing intervals — `again` always advances regardless.

### 7. Stats

A heatmap of activity, per-topic mastery rings, totals. The whole point: see your progress at a glance. Useful for figuring out which Topics you've been avoiding.

### 8. Settings

- **Daily new limit** — how many new Problems get added to the daily queue (default 3).
- **Default code language** — for the code-snippet editor.
- **Theme** — light / dark / system.
- **Drill updates SR** — see Drill mode above.
- **Reset everything** — wipe all progress in this browser. Cannot be undone (no cloud backup).

## Privacy

What stays on your device:

- Every rating, attempt, note, and code snippet you write — kept in browser `localStorage` only. No sync, no backup, no upload, no third party sees it.

What gets recorded server-side:

- Pageviews (URL path + page title), referrer, browser/OS family, and a country derived from your IP — collected by [GoatCounter](https://www.goatcounter.com/) with **no cookies** and **no individual user identifiers**. IPs are hashed with a daily-rotating salt and never stored. The dashboard tells me things like "20 people opened the Catalog this week" — never "user X did Y."

How to opt out:

- Use any adblocker — `gc.zgo.at` is on most blocklists (uBlock Origin, Brave's shields, etc.) and the analytics call will simply fail without affecting the app.
- Or block the GoatCounter domain manually: `gc.zgo.at`.

The analytics snippet lives in [`index.html`](./index.html) and is wired up via [`src/hooks/useGoatCounter.ts`](./src/hooks/useGoatCounter.ts) so SPA navigations are also counted.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest (50+ tests covering scheduler, session engine, hooks)
npm run lint
```

The analytics snippet is automatically skipped on `localhost` / `127.0.0.1`, so dev runs don't pollute the dashboard.

## Deploy

Hosted at <https://dsadeck.github.io>. To redeploy after changes:

```bash
npm run deploy
```

[`scripts/deploy.sh`](./scripts/deploy.sh) builds the SPA, generates a `404.html` fallback so deep links survive a hard reload, drops a `.nojekyll`, and force-pushes a single orphan commit of `dist/` to the `gh-pages` branch via `git remote get-url origin`. We don't use the `gh-pages` npm package — its `git checkout --orphan` step silently leaks root-level dotfiles from `main` into the published branch.

For a project-page deployment under `/<repo>/` (e.g. forks deployed to a personal `username.github.io/grindspace`), set `GRINDSPACE_BASE`:

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
      "difficulty": "Easy",
      "leetcodeUrl": "https://..."
    }
  ]
}
```

`id` is a stable slug — keep it constant even if you rename a Problem; the user's progress is keyed by it. Topic must be one of the 18 names in [`src/lib/types.ts`](./src/lib/types.ts) (or extend that union if you're adapting Grindspace for a different list).

## How the scheduler works (depth)

- [ADR 0001 — Mastery refresh interval](./docs/adr/0001-mastery-refresh-interval.md) — why mastered Problems still resurface every 90 days.
- [ADR 0002 — Leitner over SM-2 / FSRS](./docs/adr/0002-leitner-over-sm2-fsrs.md) — why we picked fixed boxes over Anki-style adaptive scheduling.
- [ADR 0003 — End-of-session recovery cap](./docs/adr/0003-end-of-session-recovery-cap.md) — why `good`/`easy` after an `again` in the same Session is capped at `hard`.
- [ADR 0004 — No export/import](./docs/adr/0004-no-export-import.md) — why there's no JSON backup feature.

## Docs

- [`CONTEXT.md`](./CONTEXT.md) — domain glossary (Problem, Attempt, Mastered, Session, Recovered Attempt). Read this before opening a PR.
- [`docs/adr/`](./docs/adr) — architectural decision records.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — how to work on the codebase.

## License

MIT — see [LICENSE](./LICENSE).
