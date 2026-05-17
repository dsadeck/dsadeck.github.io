import type { Difficulty } from "@/lib/types";

const STYLES: Record<Difficulty, string> = {
  Easy: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  Medium:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  Hard: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

export function DifficultyPill({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`pill ${STYLES[difficulty]}`}>{difficulty}</span>;
}
