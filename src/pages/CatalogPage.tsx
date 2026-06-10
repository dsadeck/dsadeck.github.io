import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PROBLEMS, problemsByTopic } from "@/data/problems";
import { useProgress } from "@/context/ProgressContext";
import { getStatus } from "@/lib/status";
import {
  TOPICS,
  type Difficulty,
  type Status,
  type Topic,
} from "@/lib/types";
import { ProblemRow } from "@/components/ProblemRow";

const STATUS_OPTIONS: Array<Status | "all"> = [
  "all",
  "new",
  "learning",
  "reviewing",
  "mastered",
  "suspended",
];
const DIFFICULTY_OPTIONS: Array<Difficulty | "all"> = [
  "all",
  "Easy",
  "Medium",
  "Hard",
];

export function CatalogPage() {
  const { store } = useProgress();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [collapsed, setCollapsed] = useState<Set<Topic>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  // `/` focuses the search box, matching the convention of GitHub and co.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const grouped = useMemo(() => problemsByTopic(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = new Map<Topic, typeof PROBLEMS>();
    for (const topic of TOPICS) {
      const ps = (grouped.get(topic) ?? []).filter((p) => {
        if (difficultyFilter !== "all" && p.difficulty !== difficultyFilter)
          return false;
        if (q && !`${p.title} ${p.topic} ${p.patterns?.join(" ") ?? ""}`.toLowerCase().includes(q))
          return false;
        if (statusFilter !== "all") {
          const status = getStatus(
            store.progress[p.id] ?? {
              id: p.id,
              box: 0,
              nextDue: null,
              attempts: [],
              suspended: false,
              tags: [],
            },
          );
          if (status !== statusFilter) return false;
        }
        return true;
      });
      if (ps.length > 0) out.set(topic, ps);
    }
    return out;
  }, [grouped, query, statusFilter, difficultyFilter, store.progress]);

  function toggle(topic: Topic) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems, topics, patterns... ( / )"
            className="flex-1 min-w-[14rem] rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900"
            aria-label="Search"
          />
          <Filter
            label="Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={(v) => setStatusFilter(v as Status | "all")}
          />
          <Filter
            label="Difficulty"
            value={difficultyFilter}
            options={DIFFICULTY_OPTIONS}
            onChange={(v) => setDifficultyFilter(v as Difficulty | "all")}
          />
        </div>
      </div>

      {[...filtered.entries()].map(([topic, ps]) => {
        const isCollapsed = collapsed.has(topic);
        return (
          <section key={topic} className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-2 dark:border-slate-800">
              <button
                type="button"
                onClick={() => toggle(topic)}
                className="flex items-center gap-2 text-left text-sm font-medium"
                aria-expanded={!isCollapsed}
              >
                <span className="text-slate-400">{isCollapsed ? "▸" : "▾"}</span>
                <span>{topic}</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  · {ps.length}
                </span>
              </button>
              <Link
                to={`/session?source=drill&topic=${encodeURIComponent(topic)}`}
                className="btn-secondary text-xs"
              >
                Drill topic
              </Link>
            </header>
            {!isCollapsed && (
              <ul>
                {ps.map((p) => (
                  <ProblemRow key={p.id} problem={p} />
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {filtered.size === 0 && (
        <p className="card p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          No problems match your filters.
        </p>
      )}
    </div>
  );
}

function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "all" ? "All" : o[0]!.toUpperCase() + o.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}
