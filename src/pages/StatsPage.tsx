import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "@/context/ProgressContext";
import { PROBLEMS, problemsByTopic } from "@/data/problems";
import { getStatus } from "@/lib/status";
import { TOPICS, type Topic } from "@/lib/types";
import { TopicProgressBar } from "@/components/TopicProgressBar";
import { Heatmap, computeStreak } from "@/components/Heatmap";

export function StatsPage() {
  const { store } = useProgress();
  const now = useMemo(() => new Date(), []);
  const grouped = useMemo(() => problemsByTopic(), []);

  const allAttempts = useMemo(() => {
    const out: { date: string }[] = [];
    for (const p of Object.values(store.progress)) {
      for (const a of p.attempts) out.push({ date: a.date });
    }
    return out;
  }, [store.progress]);

  const streak = useMemo(
    () => computeStreak(allAttempts, now),
    [allAttempts, now],
  );

  const topicStats = useMemo(() => {
    return TOPICS.map((topic: Topic) => {
      const ps = grouped.get(topic) ?? [];
      let mastered = 0;
      let reviewing = 0;
      let learning = 0;
      let nw = 0;
      for (const p of ps) {
        const prog = store.progress[p.id];
        if (!prog) {
          nw++;
          continue;
        }
        const status = getStatus(prog);
        if (status === "mastered") mastered++;
        else if (status === "reviewing") reviewing++;
        else if (status === "learning") learning++;
        else nw++;
      }
      return { topic, total: ps.length, mastered, reviewing, learning, nw };
    });
  }, [grouped, store.progress]);

  const leaks = useMemo(() => {
    const arr = Object.values(store.progress)
      .map((p) => {
        const count = p.attempts.filter((a) => a.rating === "again").length;
        return { id: p.id, count };
      })
      .filter((x) => x.count >= 2)
      .sort((a, b) => b.count - a.count);
    return arr.slice(0, 12);
  }, [store.progress]);

  const totalAttempts = allAttempts.length;
  const distinctAttempted = useMemo(
    () =>
      Object.values(store.progress).filter((p) => p.attempts.length > 0).length,
    [store.progress],
  );
  const totalMastered = topicStats.reduce((acc, t) => acc + t.mastered, 0);

  if (totalAttempts === 0) {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-lg font-semibold">No stats yet</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your attempts, streak, and per-topic mastery will show up here after
          your first rated problem.
        </p>
        <div className="mt-4 flex justify-center">
          <Link to="/" className="btn-primary">
            Start on Today
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="pt-2">
        <h1 className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Overview
        </h1>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Stat label="Attempts" value={totalAttempts} />
          <Stat
            label="Problems tried"
            value={`${distinctAttempted}/${PROBLEMS.length}`}
          />
          <Stat label="Mastered" value={`${totalMastered}/${PROBLEMS.length}`} />
          <Stat
            label="Mastery"
            value={`${Math.round((totalMastered / PROBLEMS.length) * 100)}%`}
          />
          <Stat label="Streak" value={`${streak}d`} accent={streak > 0} />
        </div>
      </section>

      <section className="border-t border-slate-200 pt-5 dark:border-slate-800">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Activity
        </h2>
        <Heatmap attempts={allAttempts} now={now} />
      </section>

      <section className="card p-6">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Topics
        </h2>
        <ul className="space-y-3">
          {topicStats.map((t) => (
            <li key={t.topic}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-medium">{t.topic}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t.mastered}/{t.total} mastered
                </span>
              </div>
              <TopicProgressBar
                mastered={t.mastered}
                reviewing={t.reviewing}
                learning={t.learning}
                total={t.total}
              />
            </li>
          ))}
        </ul>
      </section>

      {leaks.length > 0 && (
        <section className="card p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Weak spots · rated Again twice or more
          </h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {leaks.map((l) => {
              const problem = PROBLEMS.find((p) => p.id === l.id);
              if (!problem) return null;
              return (
                <li
                  key={l.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span>{problem.title}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {l.count}× Again
                    </span>
                    <Link
                      to={`/session?source=single&id=${encodeURIComponent(l.id)}`}
                      className="btn-secondary text-xs"
                    >
                      Practice
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-3xl font-semibold tracking-tight tabular-nums ${
          accent ? "text-orange-700 dark:text-orange-400" : ""
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
