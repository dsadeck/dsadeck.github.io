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
import { previewIntervals } from "@/sr/preview";
import { DifficultyPill } from "@/components/DifficultyPill";
import { RatingButtons } from "@/components/RatingButtons";
import { StatusPill } from "@/components/StatusPill";
import { CodeSnippetEditor } from "@/components/CodeSnippetEditor";
import { CodeSnippetView } from "@/components/CodeSnippetView";
import { KeyboardHints } from "@/components/KeyboardHints";
import { useSessionShortcuts } from "@/hooks/useSessionShortcuts";
import { getStatus } from "@/lib/status";
import type {
  Language,
  ProblemProgress,
  Rating,
  Topic,
} from "@/lib/types";

type FormState = {
  rating: Rating | null;
  notes: string;
  code: string;
  language: Language;
  timeMin: string;
  solvedUnaided: boolean;
};

type Toast = {
  tone: "success" | "notice";
  text: string;
};

type UndoSnapshot = {
  progress: ProblemProgress;
  session: SessionState;
  tally: Record<Rating, number>;
};

const RATING_LABEL: Record<Rating, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

const EMPTY_TALLY: Record<Rating, number> = {
  again: 0,
  hard: 0,
  good: 0,
  easy: 0,
};

function emptyForm(language: Language): FormState {
  return {
    rating: null,
    notes: "",
    code: "",
    language,
    timeMin: "",
    solvedUnaided: false,
  };
}

export function SessionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { store, getProgress, appendAttempt, replaceProgress } = useProgress();
  const settings = store.settings;
  const now = useMemo(() => new Date(), []);

  const [state, setState] = useState<SessionState | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(settings.defaultLanguage),
  );
  const [toast, setToast] = useState<Toast | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);
  const [tally, setTally] = useState<Record<Rating, number>>(EMPTY_TALLY);

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

  const hadAgainThisSession =
    state !== null &&
    currentId !== null &&
    state.failedOnceThisSession.has(currentId);

  const previews = useMemo(() => {
    if (!state || !progress) return undefined;
    return previewIntervals({
      progress,
      now: new Date(),
      source: state.source,
      settings,
      hadAgainThisSession,
    });
  }, [state, progress, settings, hadAgainThisSession]);

  const handleSubmit = useCallback(
    (ratingOverride?: Rating) => {
      const rating = ratingOverride ?? form.rating;
      if (!state || !currentId || !problem || !progress || !rating) return;
      const result = rate({
        state,
        problemId: currentId,
        progress,
        rating,
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

      // Snapshot for undo: the pre-rating progress and session state.
      setUndoSnapshot({ progress, session: state, tally });
      setTally((t) => ({ ...t, [rating]: t[rating] + 1 }));

      const interval = previews?.[rating];
      if (rating === "again" && !result.scheduledProgress) {
        setToast({
          tone: "notice",
          text: "Saved: Again. You'll see this again later this session.",
        });
      } else if (result.attempt.recoveredCappedAt) {
        setToast({
          tone: "notice",
          text: `Saved as Hard (capped): you re-attempted this problem in the same session.`,
        });
      } else if (!result.scheduledProgress) {
        setToast({
          tone: "success",
          text: `Logged: ${RATING_LABEL[rating]}. Drill left the schedule unchanged.`,
        });
      } else {
        setToast({
          tone: "success",
          text: `Saved: ${RATING_LABEL[rating]}${
            interval && interval !== "today" ? ` · next review in ${interval}` : ""
          }`,
        });
      }

      setState(result.nextState);
      setRevealed(false);
      setForm(emptyForm(settings.defaultLanguage));
    },
    [
      state,
      currentId,
      problem,
      progress,
      form,
      settings,
      replaceProgress,
      appendAttempt,
      previews,
      tally,
    ],
  );

  const handleUndo = useCallback(() => {
    if (!undoSnapshot) return;
    replaceProgress(undoSnapshot.progress);
    setState(undoSnapshot.session);
    setTally(undoSnapshot.tally);
    setUndoSnapshot(null);
    setToast(null);
    setRevealed(true);
    setForm(emptyForm(settings.defaultLanguage));
  }, [undoSnapshot, replaceProgress, settings.defaultLanguage]);

  // Auto-clear the toast (and the undo window) after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => {
      setToast(null);
      setUndoSnapshot(null);
    }, 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleSelectRating = useCallback(
    (r: Rating) => {
      if (settings.instantRating) {
        handleSubmit(r);
        return;
      }
      setForm((f) => ({ ...f, rating: r }));
    },
    [settings.instantRating, handleSubmit],
  );
  const handleReveal = useCallback(() => setRevealed(true), []);
  const handleCollapse = useCallback(() => setRevealed(false), []);

  const handleSkip = useCallback(() => {
    setState((s) => {
      if (!s) return s;
      const id = currentProblemId(s);
      if (!id || remainingCount(s) <= 1) return s;
      if (s.mainQueue[0] === id) {
        return { ...s, mainQueue: [...s.mainQueue.slice(1), id] };
      }
      return { ...s, deferredQueue: [...s.deferredQueue.slice(1), id] };
    });
    setRevealed(false);
    setForm(emptyForm(settings.defaultLanguage));
  }, [settings.defaultLanguage]);

  useSessionShortcuts({
    enabled: state !== null && problem !== undefined,
    revealed,
    hasRating: form.rating !== null,
    onReveal: handleReveal,
    onSelectRating: handleSelectRating,
    onSubmit: handleSubmit,
    onCollapse: handleCollapse,
    canUndo: undoSnapshot !== null,
    onUndo: handleUndo,
  });

  if (!state) {
    return <p className="card mx-auto max-w-2xl p-6">Loading session…</p>;
  }

  if (!problem || !progress || !currentId) {
    const total = state.completed.length;
    const rated = (["easy", "good", "hard", "again"] as Rating[]).filter(
      (r) => tally[r] > 0,
    );
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {toast && <ToastCard toast={toast} onUndo={undoSnapshot ? handleUndo : undefined} />}
        <div className="card p-6 text-center">
          <h2 className="text-lg font-semibold">Session complete</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            You worked through {total} problem{total === 1 ? "" : "s"}. Nice.
          </p>
          {rated.length > 0 && (
            <p className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
              {rated.map((r) => (
                <span
                  key={r}
                  className={`pill ${TALLY_STYLE[r]}`}
                >
                  {tally[r]} {RATING_LABEL[r]}
                </span>
              ))}
            </p>
          )}
          <div className="mt-4 flex justify-center gap-2">
            <Link to="/" className="btn-primary">
              Back to Today
            </Link>
            <Link to="/stats" className="btn-secondary">
              See stats
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const lastAttempt = progress.attempts[progress.attempts.length - 1];
  const remaining = remainingCount(state);
  const done = state.completed.length;
  const sessionTotal = done + remaining;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
            {state.label}
          </span>
          <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
            {done} of {sessionTotal} done
          </span>
        </div>
        <div className="flex items-center gap-1">
          {remaining > 1 && (
            <button
              type="button"
              className="btn-ghost"
              onClick={handleSkip}
              title="Move this problem to the end of the queue"
            >
              Skip
            </button>
          )}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate("/")}
          >
            End session
          </button>
        </div>
      </div>

      <div
        className="h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="img"
        aria-label={`Session progress: ${done} of ${sessionTotal} done`}
      >
        <div
          className="h-full origin-left rounded-full bg-slate-900 transition-transform dark:bg-slate-100"
          style={{
            transform: `scaleX(${sessionTotal === 0 ? 0 : done / sessionTotal})`,
          }}
        />
      </div>

      {toast && <ToastCard toast={toast} onUndo={undoSnapshot ? handleUndo : undefined} />}

      <section className="card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {problem.title}
          </h1>
          <DifficultyPill difficulty={problem.difficulty} />
          <StatusPill status={getStatus(progress)} />
          {progress.box > 0 && (
            <span
              className="text-sm text-slate-500 dark:text-slate-400"
              title={`Leitner box ${progress.box} of 5. Higher boxes mean longer gaps between reviews.`}
            >
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
            I'm done, rate it
          </button>
          <KeyboardHints
            className="mt-4 justify-center"
            hints={[{ keys: ["Space"], label: "rate it" }]}
          />
        </div>
      ) : (
        <section className="card space-y-4 p-6">
          <RatingButtons
            onRate={handleSelectRating}
            disabled={false}
            selected={form.rating}
            previews={previews}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <KeyboardHints
              hints={
                settings.instantRating
                  ? [
                      { keys: ["1", "2", "3", "4"], label: "rate & save" },
                      { keys: ["Esc"], label: "back" },
                    ]
                  : [
                      { keys: ["1", "2", "3", "4"], label: "rate" },
                      {
                        keys: ["Enter"],
                        label: form.rating
                          ? "save & next"
                          : "save (pick a rating)",
                      },
                      { keys: ["Esc"], label: "back" },
                    ]
              }
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setRevealed(false)}
              >
                Hide form
              </button>
              {!settings.instantRating && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleSubmit()}
                  disabled={form.rating === null}
                >
                  Save & next
                </button>
              )}
            </div>
          </div>

          <details className="rounded-md border border-slate-200 dark:border-slate-700">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Add details · time, notes, code
            </summary>
            <div className="space-y-4 border-t border-slate-200 p-3 dark:border-slate-700">
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
                    className="h-5 w-5 accent-emerald-600"
                    checked={form.solvedUnaided}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        solvedUnaided: e.target.checked,
                      }))
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  placeholder="What was the key insight? Where did you get stuck?"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </label>

              <CodeSnippetEditor
                value={form.code}
                language={form.language}
                onChange={(c) => setForm((f) => ({ ...f, code: c }))}
                onLanguageChange={(l) =>
                  setForm((f) => ({ ...f, language: l }))
                }
              />
            </div>
          </details>
        </section>
      )}
    </div>
  );
}

const TALLY_STYLE: Record<Rating, string> = {
  again: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  hard: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  good: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  easy: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
};

function ToastCard({
  toast,
  onUndo,
}: {
  toast: Toast;
  onUndo?: () => void;
}) {
  const tone =
    toast.tone === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
      : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200";
  return (
    <div
      role="status"
      className={`card flex items-center justify-between gap-3 p-3 text-sm ${tone}`}
    >
      <span>{toast.text}</span>
      {onUndo && (
        <button type="button" className="btn-secondary shrink-0" onClick={onUndo}>
          Undo
        </button>
      )}
    </div>
  );
}
