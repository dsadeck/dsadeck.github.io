import { LANGUAGES, type Language } from "@/lib/types";

export function CodeSnippetEditor({
  value,
  language,
  onChange,
  onLanguageChange,
}: {
  value: string;
  language: Language;
  onChange: (next: string) => void;
  onLanguageChange: (next: Language) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Code snippet (optional)
        </label>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
          aria-label="Language"
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        rows={8}
        placeholder="Paste your solution here..."
        className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm leading-relaxed text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
    </div>
  );
}
