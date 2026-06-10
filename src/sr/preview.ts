import { differenceInCalendarDays, parseISO } from "date-fns";
import { schedule } from "./scheduler";
import type {
  AttemptSource,
  ProblemProgress,
  Rating,
  Settings,
} from "@/lib/types";

const RATINGS: Rating[] = ["again", "hard", "good", "easy"];

/**
 * Human-readable consequence of each rating, shown on the rating buttons
 * ("1d", "7d", "today", "log only"). Computed by running the real scheduler
 * so the preview can never disagree with what actually happens, including
 * the same-Session recovery cap (hard/good/easy all schedule as `hard`
 * after an `again` earlier in the Session).
 */
export function previewIntervals(opts: {
  progress: ProblemProgress;
  now: Date;
  source: AttemptSource;
  settings: Settings;
  /** True when this Problem was already rated `again` earlier this Session. */
  hadAgainThisSession: boolean;
}): Record<Rating, string> {
  const { progress, now, source, settings, hadAgainThisSession } = opts;
  const out = {} as Record<Rating, string>;

  for (const rating of RATINGS) {
    if (rating === "again" && !hadAgainThisSession) {
      // First `again` defers within the Session; the scheduler runs later.
      out[rating] = "today";
      continue;
    }
    if (
      rating !== "again" &&
      source === "drill" &&
      !settings.drillUpdatesSr
    ) {
      out[rating] = "log only";
      continue;
    }
    // Recovered Attempt: effective rating is capped at `hard`.
    const effective: Rating =
      rating !== "again" && hadAgainThisSession ? "hard" : rating;
    const next = schedule(progress, effective, now, source);
    out[rating] = next.nextDue ? formatDays(next.nextDue, now) : "—";
  }

  return out;
}

function formatDays(nextDueIso: string, now: Date): string {
  const days = differenceInCalendarDays(parseISO(nextDueIso), now);
  return days <= 0 ? "today" : `${days}d`;
}
