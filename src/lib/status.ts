import type { ProblemProgress, Status } from "./types";

/**
 * Single source of truth for Status display logic. Status is derived from box,
 * suspended, and the last two non-drill Attempts (for mastery detection).
 *
 * Mastery rule: box === 5 and the most recent two non-drill Attempts both
 * resolved to `easy` (after recovery cap is applied).
 */
export function getStatus(p: ProblemProgress): Status {
  if (p.suspended) return "suspended";
  if (p.box === 0) return "new";
  if (p.box === 5 && isMastered(p)) return "mastered";
  if (p.box === 1) return "learning";
  return "reviewing";
}

export function isMastered(p: ProblemProgress): boolean {
  if (p.box !== 5) return false;
  const lastTwoNonDrill = p.attempts.filter((a) => a.source !== "drill").slice(-2);
  if (lastTwoNonDrill.length < 2) return false;
  return lastTwoNonDrill.every(
    (a) => (a.recoveredCappedAt ?? a.rating) === "easy",
  );
}

export function emptyProgress(id: string): ProblemProgress {
  return {
    id,
    box: 0,
    nextDue: null,
    attempts: [],
    suspended: false,
    tags: [],
  };
}
