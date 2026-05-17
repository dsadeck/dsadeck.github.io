export function TopicProgressBar({
  mastered,
  reviewing,
  learning,
  total,
}: {
  mastered: number;
  reviewing: number;
  learning: number;
  total: number;
}) {
  const masteredPct = total === 0 ? 0 : (mastered / total) * 100;
  const reviewingPct = total === 0 ? 0 : (reviewing / total) * 100;
  const learningPct = total === 0 ? 0 : (learning / total) * 100;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={mastered}
    >
      <div className="flex h-full">
        <div
          className="bg-emerald-500"
          style={{ width: `${masteredPct}%` }}
        />
        <div className="bg-sky-500" style={{ width: `${reviewingPct}%` }} />
        <div className="bg-amber-500" style={{ width: `${learningPct}%` }} />
      </div>
    </div>
  );
}
