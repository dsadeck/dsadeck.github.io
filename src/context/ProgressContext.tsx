import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useLocalStorage } from "@/storage/useLocalStorage";
import { EMPTY_STORE, migrate } from "@/storage/progressStore";
import { emptyProgress } from "@/lib/status";
import {
  STORAGE_KEY,
  type Attempt,
  type ProblemProgress,
  type Settings,
  type Store,
} from "@/lib/types";

type ProgressContextValue = {
  store: Store;
  getProgress: (id: string) => ProblemProgress;
  updateProgress: (id: string, updater: (prev: ProblemProgress) => ProblemProgress) => void;
  appendAttempt: (id: string, attempt: Attempt) => void;
  replaceProgress: (next: ProblemProgress) => void;
  setSuspended: (id: string, suspended: boolean) => void;
  updateSettings: (updater: (prev: Settings) => Settings) => void;
  resetEverything: () => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [rawStore, setRawStore] = useLocalStorage<Store>(
    STORAGE_KEY,
    EMPTY_STORE,
  );

  // Normalise on every read so unexpected shapes don't crash the UI.
  const store = useMemo(() => migrate(rawStore), [rawStore]);

  const getProgress = useCallback(
    (id: string): ProblemProgress => {
      return store.progress[id] ?? emptyProgress(id);
    },
    [store],
  );

  const updateProgress = useCallback(
    (id: string, updater: (prev: ProblemProgress) => ProblemProgress) => {
      setRawStore((prev) => {
        const current = prev.progress[id] ?? emptyProgress(id);
        const next = updater(current);
        return {
          ...prev,
          progress: { ...prev.progress, [id]: next },
        };
      });
    },
    [setRawStore],
  );

  const appendAttempt = useCallback(
    (id: string, attempt: Attempt) => {
      updateProgress(id, (p) => ({
        ...p,
        attempts: [...p.attempts, attempt],
      }));
    },
    [updateProgress],
  );

  const replaceProgress = useCallback(
    (next: ProblemProgress) => {
      setRawStore((prev) => ({
        ...prev,
        progress: { ...prev.progress, [next.id]: next },
      }));
    },
    [setRawStore],
  );

  const setSuspended = useCallback(
    (id: string, suspended: boolean) => {
      updateProgress(id, (p) => ({ ...p, suspended }));
    },
    [updateProgress],
  );

  const updateSettings = useCallback(
    (updater: (prev: Settings) => Settings) => {
      setRawStore((prev) => ({ ...prev, settings: updater(prev.settings) }));
    },
    [setRawStore],
  );

  const resetEverything = useCallback(() => {
    setRawStore(EMPTY_STORE);
  }, [setRawStore]);

  const value: ProgressContextValue = {
    store,
    getProgress,
    updateProgress,
    appendAttempt,
    replaceProgress,
    setSuspended,
    updateSettings,
    resetEverything,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx)
    throw new Error("useProgress must be used inside <ProgressProvider />");
  return ctx;
}
