type Hint = {
  keys: string[];
  label: string;
};

/**
 * Inline hint row that surfaces keyboard shortcuts to the user, e.g.
 *
 *   [1] [2] [3] [4] rate   [Enter] save & next   [Esc] back
 */
export function KeyboardHints({
  hints,
  className = "",
}: {
  hints: Hint[];
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400 ${className}`}
      aria-label="Keyboard shortcuts"
    >
      {hints.map((hint, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {hint.keys.map((k) => (
            <Kbd key={k}>{k}</Kbd>
          ))}
          <span>{hint.label}</span>
        </span>
      ))}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
      {children}
    </kbd>
  );
}
