import type { Status } from "@/lib/types";

const STYLES: Record<Status, string> = {
  new: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  learning:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
  reviewing:
    "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200",
  mastered:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
  suspended:
    "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

const LABEL: Record<Status, string> = {
  new: "New",
  learning: "Learning",
  reviewing: "Reviewing",
  mastered: "Mastered",
  suspended: "Suspended",
};

export function StatusPill({ status }: { status: Status }) {
  return <span className={`pill ${STYLES[status]}`}>{LABEL[status]}</span>;
}
