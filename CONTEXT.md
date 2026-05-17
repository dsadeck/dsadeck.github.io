# Grindspace

A single-device, browser-local spaced-repetition tool for grinding the NeetCode 150. This file is the canonical glossary — terms here are the only ones that should appear in code, UI, and docs.

## Language

**Problem**:
A single NeetCode 150 entry (e.g. "Two Sum") that the user attempts and the scheduler tracks. One Problem maps 1:1 to one progress record.
_Avoid_: Card, question, task

**Attempt**:
One self-rated event of tackling a Problem. Carries a `source` (`due | drill | single | weak-spot`) recording why the user saw it.
_Avoid_: Review (as a noun), rep, try

**Mastered**:
A Problem that has reached box 5 with two consecutive non-drill `easy` ratings. Still scheduled (90-day refresh) so long-term recall is honestly tested. Auto-downgrades to `learning` (box 1) on any `again` rating, including in drill mode.
_Avoid_: Done, completed, retired

**Session**:
A user-initiated run through a queue of Problems. Open-ended: continues until the queue is exhausted or the user clicks End. Daily limits shape the queue, not the Session.
_Avoid_: Run, sitting, study session

**Recovered Attempt**:
An Attempt where the user rated `good` or `easy` after having rated the same Problem `again` earlier in the same Session. The scheduler treats it as `hard` regardless of the clicked rating to avoid contaminated SR signal; the true rating is preserved on the Attempt.
_Avoid_: Retry, second-chance attempt

**Drill (mode)**:
A Session whose queue is built from a single Topic's non-suspended, non-mastered Problems (new ones included), ordered weakest-first. Used for focused topic practice.
_Avoid_: Cram, practice mode

**Topic**:
One of the eighteen NeetCode 150 groupings (Arrays & Hashing, Two Pointers, Sliding Window, etc.). A Problem belongs to exactly one Topic.
_Avoid_: Category, section, pattern (a Problem may have multiple "patterns" — see below)

**Pattern**:
An optional fine-grained tag on a Problem (e.g. `prefix-sum`, `monotonic-stack`). Many Problems share a Pattern across different Topics. Distinct from Topic.

## Relationships

- A **Problem** has zero or more **Attempts**, in chronological order.
- A **Problem** is in exactly one box (0-5) and has a derived **Status** (`new | learning | reviewing | mastered | suspended`).
- A **Problem** belongs to exactly one **Topic** and may carry zero or more **Patterns**.
- A **Session** consumes a queue of **Problems** and produces one **Attempt** per rating click.

## Example dialogue

> **User:** "I drilled Sliding Window yesterday and got the maximum-window one wrong twice."
> **Maintainer:** "So the first `again` deferred it to the end of the **Session**, then the second `again` ran the scheduler and dropped it to box 1. If you'd then clicked `good`, that would have been a **Recovered Attempt** — capped at `hard` so the SR signal stays honest."

## Flagged ambiguities

- "Practice" was used informally for both ad-hoc single-problem Sessions ("Practice now" button) and the **Drill** mode — resolved: "Practice now" launches a `single`-source Session; "Drill" is reserved for topic-wide Sessions.
- "Review" was used for both the act of attempting a due Problem and for reading notes — resolved: we don't use "Review" as a noun in code or types. Use **Attempt**.
