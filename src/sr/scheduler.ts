import { addDays } from "date-fns";
import {
  INTERVALS_DAYS,
  MASTERY_REFRESH_DAYS,
  type AttemptSource,
  type ProblemProgress,
  type Rating,
} from "@/lib/types";
import { isMastered } from "@/lib/status";

/**
 * Pure 4-button Leitner+ scheduler. Mutates only `box` and `nextDue`; the
 * caller is responsible for appending the Attempt to `attempts[]`.
 *
 * `source` is needed so mastery (which is restricted to non-drill `easy`
 * ratings) can be computed without inspecting the not-yet-appended Attempt.
 *
 * See docs/adr/0001 (mastery), 0002 (algorithm choice).
 */
export function schedule(
  progress: ProblemProgress,
  rating: Rating,
  now: Date,
  source: AttemptSource = "due",
): ProblemProgress {
  const wasMastered = isMastered(progress);

  if (progress.box === 0) {
    return firstAttempt(progress, rating, now);
  }

  switch (rating) {
    case "again":
      return setBoxAndDue(progress, 1, addDays(now, INTERVALS_DAYS[1]));

    case "hard": {
      const box = progress.box as 1 | 2 | 3 | 4 | 5; // box >= 1 by the branch above
      return setBoxAndDue(progress, box, addDays(now, INTERVALS_DAYS[box]));
    }

    case "good": {
      const newBox = clampBox(progress.box + 1);
      const next = setBoxAndDue(
        progress,
        newBox,
        addDays(now, INTERVALS_DAYS[newBox]),
      );
      if (wasMastered) {
        next.nextDue = addDays(now, MASTERY_REFRESH_DAYS).toISOString();
      }
      return next;
    }

    case "easy": {
      const newBox = clampBox(progress.box + 2);
      const next = setBoxAndDue(
        progress,
        newBox,
        addDays(now, INTERVALS_DAYS[newBox]),
      );
      // Mastery requires two consecutive non-drill `easy` ratings while in
      // box 5. If THIS attempt is drill, it can't satisfy that.
      const priorLastNonDrillWasEasy = lastNonDrillRating(progress) === "easy";
      const thisIsNonDrillEasy = source !== "drill";
      if (newBox === 5 && priorLastNonDrillWasEasy && thisIsNonDrillEasy) {
        next.nextDue = addDays(now, MASTERY_REFRESH_DAYS).toISOString();
      }
      return next;
    }
  }
}

function firstAttempt(
  progress: ProblemProgress,
  rating: Rating,
  now: Date,
): ProblemProgress {
  // Direct-to-box-1: rating maps directly, no graduation phase.
  switch (rating) {
    case "again":
    case "hard":
      return setBoxAndDue(progress, 1, addDays(now, 1));
    case "good":
      return setBoxAndDue(progress, 2, addDays(now, 3));
    case "easy":
      return setBoxAndDue(progress, 3, addDays(now, 7));
  }
}

function setBoxAndDue(
  progress: ProblemProgress,
  box: ProblemProgress["box"],
  due: Date,
): ProblemProgress {
  return { ...progress, box, nextDue: due.toISOString() };
}

function clampBox(n: number): 1 | 2 | 3 | 4 | 5 {
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n as 1 | 2 | 3 | 4 | 5;
}

function lastNonDrillRating(p: ProblemProgress): Rating | null {
  for (let i = p.attempts.length - 1; i >= 0; i--) {
    const a = p.attempts[i];
    if (a && a.source !== "drill") return a.recoveredCappedAt ?? a.rating;
  }
  return null;
}
