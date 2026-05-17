# 0003 — End-of-Session re-show with same-Session Recovery Cap

When a user rates `again` mid-Session, the Problem is deferred to the end of the current Session rather than scheduled straight to the next day. If the user then rates `good` or `easy` on the deferred attempt, the scheduler treats it as `hard` (the true clicked rating is preserved on the Attempt under `recoveredCappedAt`).

We considered (a) pure-Leitner — `again` schedules tomorrow with no intra-Session re-show; and (c) face-value recovery — second-attempt `good` advances the box normally.

- Pure-Leitner was rejected because a same-day re-attempt is a useful learning moment, even if it's not a true memory test.
- Face-value recovery was rejected because the re-attempt is contaminated: the user just saw the solution 15 minutes ago, so a `good` rating doesn't reflect real recall.

Capping recoveries at `hard` keeps the SR signal honest without throwing away the practice value of a second swing. The `again` → `again` path (second failure in the same Session) still routes through the scheduler normally and schedules for tomorrow.
