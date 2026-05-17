import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  createSession,
  currentProblemId,
  rate,
  remainingCount,
  type SessionState,
} from "@/sr/sessionEngine";
import { useProgress } from "@/context/ProgressContext";
import { PROBLEMS, getProblemById } from "@/data/problems";
import { buildDrillQueue, buildDueQueue, buildNewQueue } from "@/sr/picker";
import { DifficultyPill } from "@/components/DifficultyPill";
import { RatingButtons } from "@/components/RatingButtons";
import { StatusPill } from "@/components/StatusPill";
import { CodeSnippetEditor } from "@/components/CodeSnippetEditor";
import { CodeSnippetView } from "@/components/CodeSnippetView";
import { KeyboardHints } from "@/components/KeyboardHints";
import { useSessionShortcuts } from "@/hooks/useSessionShortcuts";
import { getStatus } from "@/lib/status";
import type { Language, Rating, Topic } from "@/lib/types";

type FormState = {
  rating: Rating | null;
  notes: string;
  code: string;
  language: Language;
  timeMin: string;
  solvedUnaided: boolean;
};

export function SessionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { store, getProgress, appendAttempt, replaceProgress } = useProgress();
  const settings = store.settings;
  const now = useMemo(() => new Date(), []);

  const [state, setState] = useState<SessionState | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [form, setForm] = useState<FormState>(() => ({
    rating: null,
    notes: "",
    code: "",
    language: settings.defaultLanguage,
    timeMin: "",
    solvedUnaided: true,
  }));
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  // Build the initial queue once based on URL params.
  useEffect(() => {
    const source = (params.get("source") ?? "due") as SessionState["source"];
    const id = params.get("id");
    const topic = params.get("topic") as Topic | null;

    let queue: string[] = [];
    if (source === "single" && id) queue = [id];
    else if (source === "weak-spot" && id) queue = [id];
    else if (source === "drill" && topic) {
      queue = buildDrillQueue({
        topic,
        problems: [...PROBLEMS],
        progressById: store.progress,
        now,
      });
    } else if (source === "due") {
      const due = buildDueQueue({
        problems: [...PROBLEMS],
        progressById: store.progress,
        now,
      });
      const news = buildNewQueue({
        problems: [...PROBLEMS],
        progressById: store.progress,
        limit: settings.dailyNewLimit,
      });
      queue = [...due, ...news];
    }

    setState(
      createSession({
        source,
        queue,
        ...(topic && { drillTopic: topic }),
      }),
    );
    setRevealed(false);
    // We deliberately want this to run only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentId = state ? currentProblemId(state) : null;
  const problem = currentId ? getProblemById(currentId) : undefined;
  const progress = currentId ? getProgress(currentId) : null;

  const handleSubmit = useCallback(() => {
    if (!state || !currentId || !problem || !progress || !form.rating) return;
    const result = rate({
      state,
      problemId: currentId,
      progress,
      rating: form.rating,
      settings,
      now: new Date(),
      meta: {
        ...(form.timeMin && { timeMin: Number(form.timeMin) }),
        solvedUnaided: form.solvedUnaided,
        ...(form.notes && { notes: form.notes }),
        ...(form.code && { code: form.code, language: form.language }),
      },
    });

    // Persist: append the attempt, then apply scheduler result if present.
    if (result.scheduledProgress) {
      replaceProgress({
        ...result.scheduledProgress,
        attempts: [...progress.attempts, result.attempt],
      });
    } else {
      appendAttempt(currentId, result.attempt);
    }

    // If we were the first `again`, log a friendly note for the deferred re-show.
    if (form.rating === "again" && !result.scheduledProgress) {
      setRecoveryMessage("You'll see this again later this session.");
    } else if (result.attempt.recoveredCappedAt) {
      setRecoveryMessage(
        `Capped at Hard because you re-attempted in the same Session.`,
      );
    } else {
      setRecoveryMessage(null);
    }

    setState(result.nextState);
    setRevealed(false);
    setForm({
      rating: null,
      notes: "",
      code: "",
      language: settings.defaultLanguage,
      timeMin: "",
      solvedUnaided: true,
    });
  }, [
    state,
    currentId,
    problem,
    progress,
    form,
    settings,
    replaceProgress,
    appendAttempt,
  ]);

  // Auto-clear the toast after a while.
  useEffect(() => {
    if (!recoveryMessage) return;
    const t = window.setTimeout(() => setRecoveryMessage(null), 4000);
    return () => window.clearTimeout(t);
  }, [recoveryMessage]);

  const handleSelectRating = useCallback((r: Rating) => {
    setForm((f) => ({ ...f, rating: r }));
  }, []);
  const handleReveal = useCallback(() => setRevealed(true), []);
  const handleCollapse = useCallback(() => setRevealed(false), []);

  useSessionShortcuts({
    enabled: state !== null && problem !== undefined,
    revealed,
    hasRating: form.rating !== null,
    onReveal: handleReveal,
    onSelectRating: handleSelectRating,
    onSubmit: handleSubmit,
    onCollapse: handleCollapse,
  });

  // Reset suspended progress's tracking when the user manually leaves.
  if (!state) {
    return <p className="card p-6">Loading session…</p>;
  }

  if (!problem || !progress || !currentId) {
    return (
      <div className="card p-6 text-center">
        <h2 className="text-lg font-semibold">Session complete</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          You worked through {state.completed.length} problem
          {state.completed.length === 1 ? "" : "s"}. Nice.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link to="/" className="btn-primary">
            Back to Today
          </Link>
          <Link to="/catalog" className="btn-secondary">
            Catalog
          </Link>
        </div>
      </div>
    );
  }

  const lastAttempt = progress.attempts[progress.attempts.length - 1];
  const remaining = remainingCount(state);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
            {state.label}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {remaining} remaining
          </span>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => navigate("/")}
        >
          End session
        </button>
      </div>

      {recoveryMessage && (
        <p className="card border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          {recoveryMessage}
        </p>
      )}

      <section className="card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{problem.title}</h1>
          <DifficultyPill difficulty={problem.difficulty} />
          <StatusPill status={getStatus(progress)} />
          {progress.box > 0 && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Box {progress.box}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {problem.topic}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={problem.leetcodeUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            Open on LeetCode ↗
          </a>
        </div>

        {lastAttempt?.notes && (
          <details className="mt-4 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700">
            <summary className="cursor-pointer text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Previous notes
            </summary>
            <p className="mt-2 whitespace-pre-wrap">{lastAttempt.notes}</p>
          </details>
        )}
        {lastAttempt?.code && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Previous solution ({lastAttempt.language ?? "code"})
            </summary>
            <div className="mt-2">
              <CodeSnippetView
                code={lastAttempt.code}
                language={lastAttempt.language}
              />
            </div>
          </details>
        )}
      </section>

      {!revealed ? (
        <div className="card p-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Solve the problem on LeetCode, then come back and tell us how it went.
          </p>
          <button
            type="button"
            className="btn-primary mt-4"
            onClick={() => setRevealed(true)}
          >
            I'm done — rate it
          </button>
          <KeyboardHints
            className="mt-4 justify-center"
            hints={[{ keys: ["Space"], label: "rate it" }]}
          />
        </div>
      ) : (
        <section className="card space-y-4 p-6">
          <RatingButtons onRate={handleSelectRating} disabled={false} />
          {form.rating && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selected: <span className="font-medium">{form.rating}</span>
            </p>
          )}
          <KeyboardHints
            hints={[
              { keys: ["1", "2", "3", "4"], label: "rate" },
              {
                keys: ["Enter"],
                label: form.rating ? "save & next" : "save (pick a rating)",
              },
              { keys: ["Esc"], label: "back" },
            ]}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Time (min)
              </span>
              <input
                type="number"
                min="0"
                value={form.timeMin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timeMin: e.target.value }))
                }
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2 sm:mt-5">
              <input
                type="checkbox"
                checked={form.solvedUnaided}
                onChange={(e) =>
                  setForm((f) => ({ ...f, solvedUnaided: e.target.checked }))
                }
              />
              <span>Solved without hints</span>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Notes
            </span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="What was the key insight? Where did you get stuck?"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </label>

          <CodeSnippetEditor
            value={form.code}
            language={form.language}
            onChange={(c) => setForm((f) => ({ ...f, code: c }))}
            onLanguageChange={(l) => setForm((f) => ({ ...f, language: l }))}
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setRevealed(false)}
            >
              Hide form
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={form.rating === null}
            >
              Save & next
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

