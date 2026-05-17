import type { Rating } from "@/lib/types";

const STYLES: Record<Rating, string> = {
  again:
    "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200",
  hard: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  good: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  easy: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
};

const LABEL: Record<Rating, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

export function RatingPill({ rating }: { rating: Rating }) {
  return <span className={`pill ${STYLES[rating]}`}>{LABEL[rating]}</span>;
}
