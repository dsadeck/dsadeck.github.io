import { Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useProgress } from "@/context/ProgressContext";
import { PROBLEMS } from "@/data/problems";
import { buildDueQueue, buildNewQueue, pickWeakSpot } from "@/sr/picker";
import { getStatus } from "@/lib/status";
import type { Topic } from "@/lib/types";
import { InstallToast } from "@/components/InstallPrompt";

export function TodayPage() {
  const { store } = useProgress();
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);

  const dueIds = useMemo(
    () =>
      buildDueQueue({
        problems: [...PROBLEMS],
        progressById: store.progress,
        now,
      }),
    [store.progress, now],
  );
  const newIds = useMemo(
    () =>
      buildNewQueue({
        problems: [...PROBLEMS],
        progressById: store.progress,
        limit: store.settings.dailyNewLimit,
      }),
    [store.progress, store.settings.dailyNewLimit],
  );

  const dueByTopic = useMemo(() => {
    const map = new Map<Topic, number>();
    for (const id of dueIds) {
      const problem = PROBLEMS.find((p) => p.id === id);
      if (!problem) continue;
      map.set(problem.topic, (map.get(problem.topic) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [dueIds]);

  const totalMastered = useMemo(
    () =>
      Object.values(store.progress).filter((p) => getStatus(p) === "mastered")
        .length,
    [store.progress],
  );

  const total = PROBLEMS.length;
  const totalQueue = dueIds.length + newIds.length;
  const hasAnyAttempts = useMemo(
    () => Object.values(store.progress).some((p) => p.attempts.length > 0),
    [store.progress],
  );

  return (
    <div className="space-y-6">
      <InstallToast />

      {/* Hero sits directly on the page: the numbers are the page. */}
      <section className="pt-2">
        <h1 className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Today
        </h1>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            <span
              className={
                dueIds.length > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }
            >
              {dueIds.length}
            </span>{" "}
            <span className="text-sm text-slate-500 dark:text-slate-400 font-normal tracking-normal">
              due
            </span>
          </p>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            <span className="text-sky-600 dark:text-sky-400">{newIds.length}</span>{" "}
            <span className="text-sm text-slate-500 dark:text-slate-400 font-normal tracking-normal">
              new
            </span>
          </p>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400">{totalMastered}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-normal tracking-normal">
              {" "}
              / {total} mastered
            </span>
          </p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {totalQueue === 0 ? (
            <button type="button" className="btn-primary" disabled>
              All caught up
            </button>
          ) : (
            <Link to="/session?source=due" className="btn-primary">
              Start session
            </Link>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const id = pickWeakSpot({
                problems: [...PROBLEMS],
                progressById: store.progress,
                now,
              });
              if (id) navigate(`/session?source=weak-spot&id=${encodeURIComponent(id)}`);
            }}
          >
            Random weak spot
          </button>
        </div>
      </section>

      {!hasAnyAttempts && (
        <section className="card p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            How Grindspace works
          </h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex gap-3">
              <span className="font-semibold text-slate-400 dark:text-slate-500">1</span>
              <span>
                Start a session and solve the problem on LeetCode (we link you
                straight to it).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-slate-400 dark:text-slate-500">2</span>
              <span>
                Rate how it went: Again, Hard, Good, or Easy. Each button shows
                when you'll see the problem next.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-slate-400 dark:text-slate-500">3</span>
              <span>
                Reviews space out as you improve: 1, 3, 7, 16, then 35 days.
                Mastered problems still come back every 90 days, so recall is
                honestly tested.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-slate-400 dark:text-slate-500">4</span>
              <span>
                Rate a problem Again and it drops back to short intervals.
                No cheating the schedule.
              </span>
            </li>
          </ol>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            All progress lives only in this browser: no account, no backend,
            no tracking.
          </p>
        </section>
      )}

      {dueByTopic.length > 0 && (
        <section className="border-t border-slate-200 pt-5 dark:border-slate-800">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Due by topic
          </h2>
          <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {dueByTopic.map(([topic, count]) => (
              <li
                key={topic}
                className="flex items-baseline justify-between border-b border-slate-200/70 py-1.5 text-sm dark:border-slate-800/70"
              >
                <span>{topic}</span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {totalQueue === 0 && (
        <section className="border-t border-slate-200 pt-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Nothing due right now. Pick a topic from the{" "}
          <Link to="/catalog" className="link">
            Catalog
          </Link>{" "}
          to drill, or grab a{" "}
          <button
            type="button"
            className="link"
            onClick={() => {
              const id = pickWeakSpot({
                problems: [...PROBLEMS],
                progressById: store.progress,
                now,
              });
              if (id) navigate(`/session?source=weak-spot&id=${encodeURIComponent(id)}`);
            }}
          >
            random weak spot
          </button>
          .
        </section>
      )}
    </div>
  );
}
