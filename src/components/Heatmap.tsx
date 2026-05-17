import { differenceInCalendarDays, format, parseISO, startOfDay, subDays } from "date-fns";

type Entry = {
  date: Date;
  count: number;
};

export function Heatmap({
  attempts,
  days = 182, // ~6 months keeps the grid manageable on mobile
  now = new Date(),
}: {
  attempts: { date: string }[];
  days?: number;
  now?: Date;
}) {
  const start = startOfDay(subDays(now, days - 1));
  const buckets = new Map<string, number>();
  for (const a of attempts) {
    let d: Date;
    try {
      d = parseISO(a.date);
    } catch {
      continue;
    }
    if (d < start) continue;
    const key = format(startOfDay(d), "yyyy-MM-dd");
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const entries: Entry[] = [];
  for (let i = 0; i < days; i++) {
    const d = startOfDay(subDays(now, days - 1 - i));
    const key = format(d, "yyyy-MM-dd");
    entries.push({ date: d, count: buckets.get(key) ?? 0 });
  }

  // GitHub-style: 7 rows per column (Sun..Sat), columns of weeks.
  const startDayOfWeek = start.getDay(); // 0..6
  const columns: (Entry | null)[][] = [];
  let column: (Entry | null)[] = Array.from({ length: startDayOfWeek }, () => null);
  for (const e of entries) {
    column.push(e);
    if (column.length === 7) {
      columns.push(column);
      column = [];
    }
  }
  if (column.length > 0) {
    while (column.length < 7) column.push(null);
    columns.push(column);
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid grid-flow-col grid-rows-7 gap-1 text-[10px]"
        role="img"
        aria-label="Attempt heatmap"
      >
        {columns.flatMap((col, ci) =>
          col.map((e, ri) =>
            e ? (
              <div
                key={`${ci}-${ri}`}
                title={`${format(e.date, "MMM d, yyyy")}: ${e.count} attempt${e.count === 1 ? "" : "s"}`}
                className={`h-3 w-3 rounded-sm ${cellClass(e.count)}`}
              />
            ) : (
              <div key={`${ci}-${ri}`} className="h-3 w-3" />
            ),
          ),
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Last {days} days · {entries.reduce((acc, e) => acc + e.count, 0)} attempts
      </p>
    </div>
  );
}

function cellClass(count: number): string {
  if (count <= 0) return "bg-slate-200/70 dark:bg-slate-800";
  if (count === 1)
    return "bg-emerald-200 dark:bg-emerald-900/80";
  if (count <= 3)
    return "bg-emerald-400 dark:bg-emerald-700";
  if (count <= 6)
    return "bg-emerald-500 dark:bg-emerald-500";
  return "bg-emerald-600 dark:bg-emerald-400";
}

export function computeStreak(
  attempts: { date: string }[],
  now: Date = new Date(),
): number {
  if (attempts.length === 0) return 0;
  const days = new Set(
    attempts.map((a) => format(startOfDay(parseISO(a.date)), "yyyy-MM-dd")),
  );
  let streak = 0;
  let cursor = startOfDay(now);
  // If user hasn't done anything today, count from yesterday.
  if (!days.has(format(cursor, "yyyy-MM-dd"))) {
    cursor = subDays(cursor, 1);
  }
  while (days.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1;
    cursor = subDays(cursor, 1);
    if (differenceInCalendarDays(now, cursor) > 365) break; // safety
  }
  return streak;
}
