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

  return (
    <div className="space-y-6">
      <InstallToast />

      <section className="card p-6">
        <h1 className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Today
        </h1>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <p className="text-3xl font-semibold">
            <span className="text-rose-600 dark:text-rose-400">{dueIds.length}</span>{" "}
            <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">
              due
            </span>
          </p>
          <p className="text-3xl font-semibold">
            <span className="text-sky-600 dark:text-sky-400">{newIds.length}</span>{" "}
            <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">
              new
            </span>
          </p>
          <p className="text-3xl font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">{totalMastered}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">
              {" "}
              / {total} mastered
            </span>
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            to="/session?source=due"
            className={`btn-primary ${totalQueue === 0 ? "pointer-events-none opacity-50" : ""}`}
          >
            {totalQueue === 0 ? "All caught up" : "Start session"}
          </Link>
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

      {dueByTopic.length > 0 && (
        <section className="card p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Due by topic
          </h2>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {dueByTopic.map(([topic, count]) => (
              <li
                key={topic}
                className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span>{topic}</span>
                <span className="text-slate-500 dark:text-slate-400">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {totalQueue === 0 && (
        <section className="card p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Nothing due right now. Pick a topic from the{" "}
          <Link to="/catalog" className="underline">
            Catalog
          </Link>{" "}
          to drill, or grab a{" "}
          <button
            type="button"
            className="underline"
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
