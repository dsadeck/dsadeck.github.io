import { describe, expect, it } from "vitest";
import {
  createSession,
  currentProblemId,
  rate,
  remainingCount,
} from "./sessionEngine";
import { emptyProgress } from "@/lib/status";
import { DEFAULT_SETTINGS, type ProblemProgress } from "@/lib/types";

const NOW = new Date("2026-05-16T10:00:00.000Z");

function makeProgress(id: string, overrides: Partial<ProblemProgress> = {}): ProblemProgress {
  return { ...emptyProgress(id), ...overrides };
}

describe("sessionEngine basic flow", () => {
  it("drains mainQueue in order", () => {
    let state = createSession({ source: "due", queue: ["a", "b", "c"] });
    expect(currentProblemId(state)).toBe("a");
    state = rate({
      state,
      problemId: "a",
      progress: makeProgress("a"),
      rating: "good",
      settings: DEFAULT_SETTINGS,
      now: NOW,
    }).nextState;
    expect(currentProblemId(state)).toBe("b");
    expect(remainingCount(state)).toBe(2);
  });
});

describe("sessionEngine end-of-Session re-show", () => {
  it("first `again` defers to end and does NOT call scheduler", () => {
    let state = createSession({ source: "due", queue: ["a", "b"] });

    const result = rate({
      state,
      problemId: "a",
      progress: makeProgress("a"),
      rating: "again",
      settings: DEFAULT_SETTINGS,
      now: NOW,
    });
    state = result.nextState;

    expect(result.scheduledProgress).toBeUndefined();
    expect(result.attempt.rating).toBe("again");
    expect(state.failedOnceThisSession.has("a")).toBe(true);

    // After draining main queue, "a" re-appears from the deferred queue
    state = rate({
      state,
      problemId: "b",
      progress: makeProgress("b"),
      rating: "good",
      settings: DEFAULT_SETTINGS,
      now: NOW,
    }).nextState;
    expect(currentProblemId(state)).toBe("a");
  });

  it("second `again` on same Problem calls scheduler with again", () => {
    let state = createSession({ source: "due", queue: ["a"] });
    state = rate({
      state,
      problemId: "a",
      progress: makeProgress("a"),
      rating: "again",
      settings: DEFAULT_SETTINGS,
      now: NOW,
    }).nextState;
    const result = rate({
      state,
      problemId: "a",
      progress: makeProgress("a"),
      rating: "again",
      settings: DEFAULT_SETTINGS,
      now: NOW,
    });
    expect(result.scheduledProgress).toBeDefined();
    expect(result.scheduledProgress?.box).toBe(1);
    expect(result.nextState.mainQueue).toEqual([]);
    expect(result.nextState.deferredQueue).toEqual([]);
  });

  it("recovered good/easy gets capped at hard (Recovered Attempt)", () => {
    let state = createSession({ source: "due", queue: ["a"] });
    // Start in box 3 so we can observe box behavior.
    const p = makeProgress("a", { box: 3 });
    state = rate({
      state,
      problemId: "a",
      progress: p,
      rating: "again",
      settings: DEFAULT_SETTINGS,
      now: NOW,
    }).nextState;
    const result = rate({
      state,
      problemId: "a",
      progress: p,
      rating: "good",
      settings: DEFAULT_SETTINGS,
      now: NOW,
    });
    expect(result.attempt.rating).toBe("good");
    expect(result.attempt.recoveredCappedAt).toBe("hard");
    // hard from box 3 keeps box at 3 (no advancement)
    expect(result.scheduledProgress?.box).toBe(3);
  });

  it("recovered easy is also capped at hard", () => {
    let state = createSession({ source: "due", queue: ["a"] });
    const p = makeProgress("a", { box: 2 });
    state = rate({
      state,
      problemId: "a",
      progress: p,
      rating: "again",
      settings: DEFAULT_SETTINGS,
      now: NOW,
    }).nextState;
    const result = rate({
      state,
      problemId: "a",
      progress: p,
      rating: "easy",
      settings: DEFAULT_SETTINGS,
      now: NOW,
    });
    expect(result.attempt.recoveredCappedAt).toBe("hard");
    expect(result.scheduledProgress?.box).toBe(2);
  });
});

describe("sessionEngine drill-mode interactions", () => {
  it("drill mode with drillUpdatesSr=false skips scheduler for good/easy", () => {
    const settings = { ...DEFAULT_SETTINGS, drillUpdatesSr: false };
    let state = createSession({
      source: "drill",
      queue: ["a"],
      drillTopic: "Sliding Window",
    });
    const result = rate({
      state,
      problemId: "a",
      progress: makeProgress("a", { box: 2 }),
      rating: "good",
      settings,
      now: NOW,
    });
    expect(result.scheduledProgress).toBeUndefined();
    expect(result.attempt.source).toBe("drill");
    state = result.nextState;
    expect(currentProblemId(state)).toBeNull();
  });

  it("drill mode still calls scheduler for `again` even when drillUpdatesSr=false", () => {
    const settings = { ...DEFAULT_SETTINGS, drillUpdatesSr: false };
    let state = createSession({
      source: "drill",
      queue: ["a"],
      drillTopic: "Sliding Window",
    });
    // First again -> defer (no scheduler regardless)
    state = rate({
      state,
      problemId: "a",
      progress: makeProgress("a", { box: 3 }),
      rating: "again",
      settings,
      now: NOW,
    }).nextState;
    // Second again -> scheduler runs even though drillUpdatesSr is false
    const result = rate({
      state,
      problemId: "a",
      progress: makeProgress("a", { box: 3 }),
      rating: "again",
      settings,
      now: NOW,
    });
    expect(result.scheduledProgress).toBeDefined();
    expect(result.scheduledProgress?.box).toBe(1);
  });

  it("drill label includes the topic", () => {
    const state = createSession({
      source: "drill",
      queue: ["a"],
      drillTopic: "Sliding Window",
    });
    expect(state.label).toBe("Drill: Sliding Window");
  });
});
