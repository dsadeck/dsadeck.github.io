import { useMemo } from "react";
import {
  formatAbsoluteAttemptDate,
  formatRelativeAttemptDate,
} from "@/lib/attemptDate";
import type { Attempt, AttemptSource } from "@/lib/types";
import { RatingPill } from "./RatingPill";
import { CodeSnippetView } from "./CodeSnippetView";

const SOURCE_LABEL: Record<AttemptSource, string> = {
  due: "Due",
  drill: "Drill",
  single: "Practice",
  "weak-spot": "Weak spot",
};

/**
 * Per-Problem Attempt history. Renders attempts most-recent-first, with
 * collapsible notes / code per attempt.
 *
 * If `cappedAt` is set on an Attempt (same-Session recovery), we show both
 * the user's clicked rating and the SR-effective capped rating.
 */
export function AttemptHistory({ attempts }: { attempts: Attempt[] }) {
  const ordered = useMemo(
    () => [...attempts].slice().reverse(),
    [attempts],
  );
  const now = useMemo(() => new Date(), []);

  if (ordered.length === 0) {
    return (
      <p className="card p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        No attempts yet. Hit{" "}
        <span className="font-medium">Practice now</span> to log your first
        one.
      </p>
    );
  }

  return (
    <ol className="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
      {ordered.map((a, i) => (
        <li key={`${a.date}-${i}`} className="p-4">
          <AttemptItem attempt={a} now={now} />
        </li>
      ))}
    </ol>
  );
}

function AttemptItem({ attempt, now }: { attempt: Attempt; now: Date }) {
  const relative = formatRelativeAttemptDate(attempt.date, now);
  const absolute = formatAbsoluteAttemptDate(attempt.date);
  const capped = attempt.recoveredCappedAt;

  return (
    <article className="space-y-2">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <RatingPill rating={attempt.rating} />
        {capped && capped !== attempt.rating && (
          <span
            className="pill bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
            title="Capped at Hard because of an earlier 'again' in the same Session"
          >
            → {capped}
          </span>
        )}
        <span className="pill bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {SOURCE_LABEL[attempt.source]}
        </span>
        <time
          dateTime={attempt.date}
          title={absolute}
          className="text-xs text-slate-500 dark:text-slate-400"
        >
          {relative}
        </time>
        {typeof attempt.timeMin === "number" && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            · {attempt.timeMin} min
          </span>
        )}
        {!attempt.solvedUnaided && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            · used hints
          </span>
        )}
      </header>

      {attempt.notes && (
        <details className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
          <summary className="cursor-pointer text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Notes
          </summary>
          <p className="mt-2 whitespace-pre-wrap">{attempt.notes}</p>
        </details>
      )}

      {attempt.code && (
        <details className="rounded-md">
          <summary className="cursor-pointer text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Solution{attempt.language ? ` · ${attempt.language}` : ""}
          </summary>
          <div className="mt-2">
            <CodeSnippetView
              code={attempt.code}
              language={attempt.language}
            />
          </div>
        </details>
      )}
    </article>
  );
}
