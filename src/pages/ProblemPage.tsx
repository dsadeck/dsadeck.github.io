import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { getProblemById } from "@/data/problems";
import { useProgress } from "@/context/ProgressContext";
import { getStatus, emptyProgress } from "@/lib/status";
import { DifficultyPill } from "@/components/DifficultyPill";
import { StatusPill } from "@/components/StatusPill";
import { AttemptHistory } from "@/components/AttemptHistory";

export function ProblemPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { getProgress, setSuspended, replaceProgress } = useProgress();
  const problem = getProblemById(id);
  const progress = getProgress(id);
  const status = getStatus(progress);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const dueText = useMemo(() => {
    if (status === "new") return "—";
    if (!progress.nextDue) return "—";
    return formatDistanceToNowStrict(parseISO(progress.nextDue), {
      addSuffix: true,
    });
  }, [progress.nextDue, status]);

  if (!problem) {
    return <Navigate to="/catalog" replace />;
  }

  const stats = computeStats(progress.attempts);

  return (
    <div className="space-y-4">
      <p className="text-xs">
        <Link
          to="/catalog"
          className="text-slate-500 hover:underline dark:text-slate-400"
        >
          ← Back to catalog
        </Link>
      </p>

      <section className="card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{problem.title}</h1>
          <DifficultyPill difficulty={problem.difficulty} />
          <StatusPill status={status} />
          {progress.box > 0 && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Box {progress.box}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {problem.topic}
          {problem.patterns && problem.patterns.length > 0 && (
            <> · {problem.patterns.join(", ")}</>
          )}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <Stat label="Next due">{dueText}</Stat>
          <Stat label="Attempts">{stats.total}</Stat>
          <Stat label="Again">{stats.again}</Stat>
          <Stat label="Avg time">
            {stats.avgTimeMin === null ? "—" : `${stats.avgTimeMin} min`}
          </Stat>
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            to={`/session?source=single&id=${encodeURIComponent(problem.id)}`}
            className="btn-primary"
          >
            Practice now
          </Link>
          <a
            href={problem.leetcodeUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            Open on LeetCode ↗
          </a>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setSuspended(problem.id, !progress.suspended)}
          >
            {progress.suspended ? "Unsuspend" : "Suspend"}
          </button>
          {progress.attempts.length > 0 && (
            <button
              type="button"
              className="btn-danger ml-auto"
              onClick={() => {
                if (confirmingReset) {
                  replaceProgress(emptyProgress(problem.id));
                  setConfirmingReset(false);
                } else {
                  setConfirmingReset(true);
                }
              }}
              onBlur={() => setConfirmingReset(false)}
              title="Wipes this Problem's progress and Attempts. Other Problems are untouched."
            >
              {confirmingReset ? "Click again to confirm" : "Reset progress"}
            </button>
          )}
        </div>
      </section>

      <h2 className="mt-2 text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Attempt history
      </h2>
      <AttemptHistory attempts={progress.attempts} />
    </div>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

function computeStats(attempts: { rating: string; timeMin?: number }[]) {
  let again = 0;
  const times: number[] = [];
  for (const a of attempts) {
    if (a.rating === "again") again++;
    if (typeof a.timeMin === "number") times.push(a.timeMin);
  }
  const avgTimeMin =
    times.length === 0
      ? null
      : Math.round(times.reduce((s, n) => s + n, 0) / times.length);
  return { total: attempts.length, again, avgTimeMin };
}
