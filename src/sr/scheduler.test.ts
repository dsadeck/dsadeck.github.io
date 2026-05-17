import { describe, expect, it } from "vitest";
import { addDays, parseISO } from "date-fns";
import { schedule } from "./scheduler";
import { emptyProgress, isMastered } from "@/lib/status";
import {
  INTERVALS_DAYS,
  MASTERY_REFRESH_DAYS,
  type Attempt,
  type ProblemProgress,
  type Rating,
} from "@/lib/types";

const NOW = new Date("2026-05-16T10:00:00.000Z");

function daysFromNow(iso: string | null): number {
  if (!iso) throw new Error("expected nextDue");
  const due = parseISO(iso);
  const diffMs = due.getTime() - NOW.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function applyRating(
  progress: ProblemProgress,
  rating: Rating,
  opts: { source?: Attempt["source"]; recoveredCappedAt?: Rating } = {},
): ProblemProgress {
  const source = opts.source ?? "due";
  const next = schedule(progress, opts.recoveredCappedAt ?? rating, NOW, source);
  const attempt: Attempt = {
    date: NOW.toISOString(),
    rating,
    source,
    recoveredCappedAt: opts.recoveredCappedAt,
    solvedUnaided: true,
  };
  return { ...next, attempts: [...next.attempts, attempt] };
}

describe("scheduler (first attempt, box 0)", () => {
  const p = emptyProgress("two-sum");

  it("again -> box 1, due in 1 day", () => {
    const next = schedule(p, "again", NOW);
    expect(next.box).toBe(1);
    expect(daysFromNow(next.nextDue)).toBe(1);
  });

  it("hard -> box 1, due in 1 day", () => {
    const next = schedule(p, "hard", NOW);
    expect(next.box).toBe(1);
    expect(daysFromNow(next.nextDue)).toBe(1);
  });

  it("good -> box 2, due in 3 days", () => {
    const next = schedule(p, "good", NOW);
    expect(next.box).toBe(2);
    expect(daysFromNow(next.nextDue)).toBe(3);
  });

  it("easy -> box 3, due in 7 days", () => {
    const next = schedule(p, "easy", NOW);
    expect(next.box).toBe(3);
    expect(daysFromNow(next.nextDue)).toBe(7);
  });
});

describe("scheduler (subsequent attempts)", () => {
  it("again resets any box to box 1, due in 1 day", () => {
    for (const startBox of [1, 2, 3, 4, 5] as const) {
      const p = { ...emptyProgress("p"), box: startBox };
      const next = schedule(p, "again", NOW);
      expect(next.box).toBe(1);
      expect(daysFromNow(next.nextDue)).toBe(1);
    }
  });

  it("hard keeps box the same and refreshes interval", () => {
    const p = { ...emptyProgress("p"), box: 3 as const };
    const next = schedule(p, "hard", NOW);
    expect(next.box).toBe(3);
    expect(daysFromNow(next.nextDue)).toBe(INTERVALS_DAYS[3]);
  });

  it("good advances by 1 box and uses new interval", () => {
    const p = { ...emptyProgress("p"), box: 2 as const };
    const next = schedule(p, "good", NOW);
    expect(next.box).toBe(3);
    expect(daysFromNow(next.nextDue)).toBe(INTERVALS_DAYS[3]);
  });

  it("easy advances by 2 boxes and uses new interval", () => {
    const p = { ...emptyProgress("p"), box: 2 as const };
    const next = schedule(p, "easy", NOW);
    expect(next.box).toBe(4);
    expect(daysFromNow(next.nextDue)).toBe(INTERVALS_DAYS[4]);
  });

  it("good/easy clamp box at 5", () => {
    const p = { ...emptyProgress("p"), box: 5 as const };
    expect(schedule(p, "good", NOW).box).toBe(5);
    expect(schedule(p, "easy", NOW).box).toBe(5);
  });
});

describe("scheduler (mastery)", () => {
  it("reaching box 5 with prior non-drill easy yields 90-day refresh", () => {
    let p = emptyProgress("p");
    p = applyRating(p, "easy"); // box 3
    p = applyRating(p, "easy"); // box 5; previous Attempt was easy
    expect(p.box).toBe(5);
    expect(daysFromNow(p.nextDue)).toBe(MASTERY_REFRESH_DAYS);
    expect(isMastered(p)).toBe(true);
  });

  it("good on a mastered Problem stays mastered and re-schedules at 90d", () => {
    let p = emptyProgress("p");
    p = applyRating(p, "easy"); // box 3
    p = applyRating(p, "easy"); // box 5, mastered
    p = applyRating(p, "good"); // still box 5
    expect(p.box).toBe(5);
    expect(daysFromNow(p.nextDue)).toBe(MASTERY_REFRESH_DAYS);
    expect(isMastered(p)).toBe(false); // last two attempts: easy, good -> not mastered
  });

  it("again un-masters back to box 1 even after mastery", () => {
    let p = emptyProgress("p");
    p = applyRating(p, "easy");
    p = applyRating(p, "easy");
    expect(isMastered(p)).toBe(true);
    p = applyRating(p, "again");
    expect(p.box).toBe(1);
    expect(daysFromNow(p.nextDue)).toBe(1);
    expect(isMastered(p)).toBe(false);
  });

  it("drill-mode easy does not count toward mastery", () => {
    let p = emptyProgress("p");
    p = applyRating(p, "easy"); // box 3
    p = applyRating(p, "easy", { source: "drill" }); // box 5
    expect(p.box).toBe(5);
    expect(isMastered(p)).toBe(false);
    // nextDue should be the box-5 interval (35d), not 90d
    expect(daysFromNow(p.nextDue)).toBe(INTERVALS_DAYS[5]);
  });

  it("again un-masters even when source is drill", () => {
    let p = emptyProgress("p");
    p = applyRating(p, "easy");
    p = applyRating(p, "easy");
    expect(isMastered(p)).toBe(true);
    p = applyRating(p, "again", { source: "drill" });
    expect(p.box).toBe(1);
    expect(isMastered(p)).toBe(false);
  });
});

describe("scheduler (purity)", () => {
  it("does not mutate the input progress", () => {
    const before: ProblemProgress = {
      ...emptyProgress("p"),
      box: 2,
      nextDue: addDays(NOW, -1).toISOString(),
    };
    const snapshot = JSON.parse(JSON.stringify(before));
    schedule(before, "good", NOW);
    expect(before).toEqual(snapshot);
  });
});
