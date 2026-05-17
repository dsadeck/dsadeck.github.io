import { schedule } from "./scheduler";
import type {
  Attempt,
  AttemptSource,
  ProblemId,
  ProblemProgress,
  Rating,
  Settings,
} from "@/lib/types";

export type SessionSource = AttemptSource;

export type SessionState = {
  source: SessionSource;
  /** Topic name when source === "drill", else null. */
  drillTopic: string | null;
  /** Display label for the Session header pill (e.g. "Drill: Sliding Window"). */
  label: string;
  mainQueue: ProblemId[];
  deferredQueue: ProblemId[];
  failedOnceThisSession: Set<ProblemId>;
  /** Problems that have been fully resolved (rated and removed from queues). */
  completed: ProblemId[];
};

export type RateResult = {
  nextState: SessionState;
  /** The Attempt to append to the Problem's attempts[]. Always present. */
  attempt: Attempt;
  /**
   * The updated ProblemProgress after the scheduler ran. Omitted when the
   * scheduler was skipped (first `again` for a Problem in a Session, or
   * drill-mode hard/good/easy with drillUpdatesSr === false).
   */
  scheduledProgress?: ProblemProgress;
};

export function createSession(input: {
  source: SessionSource;
  queue: ProblemId[];
  drillTopic?: string;
}): SessionState {
  const label =
    input.source === "drill" && input.drillTopic
      ? `Drill: ${input.drillTopic}`
      : input.source === "weak-spot"
        ? "Weak spot"
        : input.source === "single"
          ? "Practice"
          : "Today";
  return {
    source: input.source,
    drillTopic: input.drillTopic ?? null,
    label,
    mainQueue: [...input.queue],
    deferredQueue: [],
    failedOnceThisSession: new Set(),
    completed: [],
  };
}

export function currentProblemId(state: SessionState): ProblemId | null {
  return state.mainQueue[0] ?? state.deferredQueue[0] ?? null;
}

export function remainingCount(state: SessionState): number {
  return state.mainQueue.length + state.deferredQueue.length;
}

export function rate(opts: {
  state: SessionState;
  problemId: ProblemId;
  progress: ProblemProgress;
  rating: Rating;
  settings: Settings;
  now: Date;
  meta?: {
    timeMin?: number;
    solvedUnaided?: boolean;
    notes?: string;
    code?: string;
    language?: Attempt["language"];
  };
}): RateResult {
  const { state, problemId, progress, rating, settings, now, meta } = opts;
  const hadAgainBefore = state.failedOnceThisSession.has(problemId);

  // Case 1: First `again` for this Problem in the session -> defer, no scheduler.
  if (rating === "again" && !hadAgainBefore) {
    const attempt: Attempt = buildAttempt(rating, state.source, now, meta);
    return {
      nextState: pushToDeferred(state, problemId),
      attempt,
      // scheduler intentionally not called yet
    };
  }

  // Case 2: Second `again` for this Problem -> scheduler always runs.
  if (rating === "again" && hadAgainBefore) {
    const attempt: Attempt = buildAttempt(rating, state.source, now, meta);
    const scheduledProgress = schedule(progress, "again", now, state.source);
    return {
      nextState: removeFromAllQueues(state, problemId),
      attempt,
      scheduledProgress,
    };
  }

  // Case 3: hard/good/easy after a same-session `again` -> Recovered Attempt.
  // Effective rating capped at `hard` to keep the SR signal honest.
  if (hadAgainBefore) {
    const attempt: Attempt = buildAttempt(rating, state.source, now, meta, "hard");
    const skipScheduler = shouldSkipScheduler(state.source, rating, settings);
    const scheduledProgress = skipScheduler
      ? undefined
      : schedule(progress, "hard", now, state.source);
    return {
      nextState: removeFromAllQueues(state, problemId),
      attempt,
      scheduledProgress,
    };
  }

  // Case 4: hard/good/easy, no prior `again` this session.
  const attempt: Attempt = buildAttempt(rating, state.source, now, meta);
  const skipScheduler = shouldSkipScheduler(state.source, rating, settings);
  const scheduledProgress = skipScheduler
    ? undefined
    : schedule(progress, rating, now, state.source);
  return {
    nextState: removeFromAllQueues(state, problemId),
    attempt,
    scheduledProgress,
  };
}

function buildAttempt(
  rating: Rating,
  source: SessionSource,
  now: Date,
  meta: Parameters<typeof rate>[0]["meta"],
  recoveredCappedAt?: Rating,
): Attempt {
  return {
    date: now.toISOString(),
    rating,
    source,
    recoveredCappedAt,
    solvedUnaided: meta?.solvedUnaided ?? true,
    ...(meta?.timeMin !== undefined && { timeMin: meta.timeMin }),
    ...(meta?.notes !== undefined && { notes: meta.notes }),
    ...(meta?.code !== undefined && { code: meta.code }),
    ...(meta?.language !== undefined && { language: meta.language }),
  };
}

function shouldSkipScheduler(
  source: SessionSource,
  rating: Rating,
  settings: Settings,
): boolean {
  // `again` always advances regardless of drill setting (regression respected).
  if (rating === "again") return false;
  if (source === "drill" && !settings.drillUpdatesSr) return true;
  return false;
}

function pushToDeferred(state: SessionState, id: ProblemId): SessionState {
  const newFailed = new Set(state.failedOnceThisSession);
  newFailed.add(id);
  return {
    ...state,
    mainQueue: state.mainQueue.filter((q) => q !== id),
    deferredQueue: [...state.deferredQueue.filter((q) => q !== id), id],
    failedOnceThisSession: newFailed,
  };
}

function removeFromAllQueues(state: SessionState, id: ProblemId): SessionState {
  return {
    ...state,
    mainQueue: state.mainQueue.filter((q) => q !== id),
    deferredQueue: state.deferredQueue.filter((q) => q !== id),
    completed: [...state.completed, id],
  };
}
