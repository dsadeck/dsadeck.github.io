import { differenceInCalendarDays, format, parseISO } from "date-fns";

/**
 * Display-only formatters for Attempt timestamps. Kept as pure functions so
 * they can be tested without rendering, and so the absolute date can be used
 * inside a `<time title>` tooltip.
 */

/** "Today, 14:23", "Yesterday, 09:00", "3 days ago", "Jun 4, 2024". */
export function formatRelativeAttemptDate(iso: string, now: Date): string {
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = differenceInCalendarDays(now, d);

  if (diff === 0) return `Today, ${format(d, "HH:mm")}`;
  if (diff === 1) return `Yesterday, ${format(d, "HH:mm")}`;
  if (diff > 1 && diff <= 6) return `${diff} days ago`;
  if (diff < 0) {
    // Future-dated Attempts shouldn't really happen, but be robust.
    if (diff === -1) return `Tomorrow, ${format(d, "HH:mm")}`;
    return format(d, "MMM d, yyyy");
  }
  return format(d, "MMM d, yyyy");
}

/** Full, unambiguous timestamp for tooltips: "2024-06-04 14:23". */
export function formatAbsoluteAttemptDate(iso: string): string {
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return format(d, "yyyy-MM-dd HH:mm");
}
