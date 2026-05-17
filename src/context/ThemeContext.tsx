import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useProgress } from "./ProgressContext";

type Mode = "light" | "dark" | "system";

type ThemeContextValue = {
  mode: Mode;
  resolved: "light" | "dark";
  setMode: (mode: Mode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { store, updateSettings } = useProgress();
  const mode = store.settings.theme;
  const resolved = useResolvedTheme(mode);

  useEffect(() => {
    const root = document.documentElement;
    if (resolved === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    root.style.colorScheme = resolved;
  }, [resolved]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolved,
      setMode: (next) => updateSettings((s) => ({ ...s, theme: next })),
    }),
    [mode, resolved, updateSettings],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider />");
  return ctx;
}

function useResolvedTheme(mode: Mode): "light" | "dark" {
  const getSystem = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  // Re-render on system change when in "system" mode.
  const [, force] = useReducerForce();
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => force();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode, force]);

  if (mode === "system") return getSystem();
  return mode;
}

// Minimal force-update helper to avoid pulling in useState gymnastics.
import { useReducer } from "react";
function useReducerForce(): [number, () => void] {
  const [n, dispatch] = useReducer((x: number) => x + 1, 0);
  return [n, () => dispatch()];
}
