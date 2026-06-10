import { Link } from "react-router-dom";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { useProgress } from "@/context/ProgressContext";
import { getStatus } from "@/lib/status";
import type { Problem } from "@/lib/types";
import { StatusPill } from "./StatusPill";
import { DifficultyPill } from "./DifficultyPill";

export function ProblemRow({ problem }: { problem: Problem }) {
  const { getProgress, setSuspended } = useProgress();
  const progress = getProgress(problem.id);
  const status = getStatus(progress);
  const lastAttempt = progress.attempts[progress.attempts.length - 1];
  const dueText =
    status === "new"
      ? "—"
      : progress.nextDue
        ? formatDistanceToNowStrict(parseISO(progress.nextDue), {
            addSuffix: true,
          })
        : "—";

  return (
    <li className="flex flex-col gap-2 border-t border-slate-100 px-3 py-2 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/problem/${encodeURIComponent(problem.id)}`}
            className="font-medium text-slate-900 hover:underline dark:text-slate-100"
          >
            {problem.title}
          </Link>
          <a
            href={problem.leetcodeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Open on LeetCode"
            aria-label={`Open ${problem.title} on LeetCode`}
          >
            ↗
          </a>
          <DifficultyPill difficulty={problem.difficulty} />
          <StatusPill status={status} />
          {progress.box > 0 && (
            <span
              className="text-xs text-slate-500 dark:text-slate-400"
              title={`Leitner box ${progress.box} of 5. Higher boxes mean longer gaps between reviews.`}
            >
              Box {progress.box}
            </span>
          )}
          {lastAttempt?.language && (
            <span className="pill bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {lastAttempt.language}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Next: {dueText}
          {progress.attempts.length > 0 && (
            <>
              {" · "}
              {progress.attempts.length} attempt
              {progress.attempts.length === 1 ? "" : "s"}
            </>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to={`/session?source=single&id=${encodeURIComponent(problem.id)}`}
          className="btn-secondary"
        >
          Practice now
        </Link>
        {/* On touch screens Suspend moves to the problem page: it sits one
            mis-tap away from "Practice now" and silently removes the problem
            from every queue. */}
        <button
          type="button"
          className="btn-ghost hidden sm:inline-flex"
          onClick={() => setSuspended(problem.id, !progress.suspended)}
          aria-label={progress.suspended ? "Unsuspend" : "Suspend"}
          title={progress.suspended ? "Unsuspend" : "Suspend (hide from queue)"}
        >
          {progress.suspended ? "Unsuspend" : "Suspend"}
        </button>
      </div>
    </li>
  );
}
