# 0002 — 4-button Leitner+ scheduler over SM-2 / FSRS

We chose a simple 4-button Leitner+ scheduler (boxes 1–5, intervals `[1, 3, 7, 16, 35]` days, plus a 90-day mastery refresh) over SM-2 (Anki-style ease factor) and FSRS (modern probabilistic).

For a 150-problem personal tool, the explainability and debuggability of fixed intervals beats the marginal accuracy of adaptive schedulers. SM-2's ease factor is famously over-tuned for vocab and produces opaque intervals. FSRS is excellent but its parameter-fitting machinery is overkill at this scale and would dominate the codebase.

The scheduler module (`src/sr/scheduler.ts`) exposes a narrow `schedule(progress, rating, now)` interface so a future swap (e.g. to FSRS) is mechanically possible without touching pages.
