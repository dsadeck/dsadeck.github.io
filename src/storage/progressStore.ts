import {
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  type ProblemProgress,
  type Settings,
  type Store,
} from "@/lib/types";

export const EMPTY_STORE: Store = {
  version: 1,
  progress: {},
  settings: DEFAULT_SETTINGS,
};

/**
 * Migrates a stored blob to the current Store shape. Today we are at v1, so
 * this is mostly a defensive normaliser. Future versions add cases here.
 */
export function migrate(raw: unknown): Store {
  if (!raw || typeof raw !== "object") return EMPTY_STORE;
  const obj = raw as Partial<Store>;
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...(obj.settings ?? {}),
  };
  const progress: Record<string, ProblemProgress> = {};
  if (obj.progress && typeof obj.progress === "object") {
    for (const [id, p] of Object.entries(obj.progress)) {
      if (!p || typeof p !== "object") continue;
      progress[id] = normaliseProgress(id, p as Partial<ProblemProgress>);
    }
  }
  return { version: 1, progress, settings };
}

function normaliseProgress(
  id: string,
  p: Partial<ProblemProgress>,
): ProblemProgress {
  return {
    id,
    box: clampBox(p.box ?? 0),
    nextDue: typeof p.nextDue === "string" ? p.nextDue : null,
    attempts: Array.isArray(p.attempts) ? p.attempts : [],
    suspended: p.suspended === true,
    tags: Array.isArray(p.tags) ? p.tags : [],
  };
}

function clampBox(n: number): ProblemProgress["box"] {
  if (n <= 0) return 0;
  if (n >= 5) return 5;
  return Math.round(n) as ProblemProgress["box"];
}

export function loadStore(): Store {
  if (typeof window === "undefined") return EMPTY_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    return migrate(JSON.parse(raw));
  } catch {
    return EMPTY_STORE;
  }
}

export function saveStore(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error("[grindspace] failed to save store", err);
  }
}

export function resetStore(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
