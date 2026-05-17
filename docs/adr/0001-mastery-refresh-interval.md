# 0001 — Mastered Problems re-occur at a 90-day interval

Spaced repetition is meant to fight knowledge decay, so a "mastered" Problem should still be re-tested occasionally — otherwise the mastery label lies as time passes. After two consecutive non-drill `easy` ratings in box 5, a Problem is considered Mastered (the status is derived; we don't store a flag) and rescheduled 90 days out. Any `again` rating — including from drill mode — un-masters it back to box 1.

We considered "retired forever" (no further `nextDue` once mastered) but rejected it because it disconnects mastery from reality and makes the Stats page misleading after a few months. We also considered making the 90-day interval configurable but kept it fixed for now to reduce settings surface; we can promote it later if users ask.
