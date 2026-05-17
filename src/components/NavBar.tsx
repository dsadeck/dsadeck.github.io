import { NavLink } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";

export function NavBar() {
  const { mode, setMode } = useTheme();

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Grindspace</span>
          <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:inline">
            NeetCode 150, with spaced repetition
          </span>
        </div>
        <nav className="flex items-center gap-1">
          <NavItem to="/">Today</NavItem>
          <NavItem to="/catalog">Catalog</NavItem>
          <NavItem to="/stats">Stats</NavItem>
          <NavItem to="/settings">Settings</NavItem>
          <button
            type="button"
            className="btn-ghost ml-2"
            aria-label="Toggle theme"
            onClick={() => {
              const next =
                mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
              setMode(next);
            }}
            title={`Theme: ${mode} (click to change)`}
          >
            {mode === "light" ? "☀" : mode === "dark" ? "☾" : "◐"}
          </button>
        </nav>
      </div>
    </header>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        [
          "rounded-md px-3 py-1.5 text-sm font-medium",
          isActive
            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}
