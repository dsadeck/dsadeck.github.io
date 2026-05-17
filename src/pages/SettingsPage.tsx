import { useState } from "react";
import { useProgress } from "@/context/ProgressContext";
import { useTheme } from "@/context/ThemeContext";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { LANGUAGES, type Language } from "@/lib/types";
import { CATALOG_VERSION } from "@/data/problems";

export function SettingsPage() {
  const { store, updateSettings, resetEverything } = useProgress();
  const { mode, setMode } = useTheme();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [confirmStep, setConfirmStep] = useState(0);

  return (
    <div className="space-y-6">
      <section className="card p-6 space-y-4">
        <h1 className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Settings
        </h1>

        <Row label="Daily new limit" hint="How many new problems can enter your queue per day.">
          <input
            type="number"
            min="0"
            max="20"
            value={store.settings.dailyNewLimit}
            onChange={(e) =>
              updateSettings((s) => ({
                ...s,
                dailyNewLimit: Math.max(0, Number(e.target.value) || 0),
              }))
            }
            className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </Row>

        <Row label="Theme">
          <select
            value={mode}
            onChange={(e) =>
              setMode(e.target.value as "light" | "dark" | "system")
            }
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Row>

        <Row label="Default language" hint="Used when you start typing a code snippet.">
          <select
            value={store.settings.defaultLanguage}
            onChange={(e) =>
              updateSettings((s) => ({
                ...s,
                defaultLanguage: e.target.value as Language,
              }))
            }
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Row>

        <Row
          label="Drill updates SR"
          hint="If off, drill-mode hard/good/easy ratings log only; the schedule isn't advanced. 'Again' always reschedules."
        >
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={store.settings.drillUpdatesSr}
              onChange={(e) =>
                updateSettings((s) => ({
                  ...s,
                  drillUpdatesSr: e.target.checked,
                }))
              }
            />
            <span>{store.settings.drillUpdatesSr ? "On" : "Off"}</span>
          </label>
        </Row>
      </section>

      <section className="card p-6 space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          App
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            className="btn-secondary"
            disabled={!canInstall}
            onClick={async () => {
              await promptInstall();
            }}
          >
            {canInstall ? "Install app" : "Install unavailable"}
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Problem set v{CATALOG_VERSION}
          </p>
        </div>
      </section>

      <section className="card p-6 space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-rose-600 dark:text-rose-400">
          Danger zone
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Reset Everything wipes all your Grindspace data in this browser. There
          is no undo and no backup (see{" "}
          <a
            href="https://github.com/yourname/grindspace/blob/main/docs/adr/0004-no-export-import.md"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            ADR-0004
          </a>
          ).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {confirmStep === 0 && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => setConfirmStep(1)}
            >
              Reset Everything
            </button>
          )}
          {confirmStep === 1 && (
            <>
              <button
                type="button"
                className="btn-danger"
                onClick={() => setConfirmStep(2)}
              >
                Really? Click once more
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setConfirmStep(0)}
              >
                Cancel
              </button>
            </>
          )}
          {confirmStep === 2 && (
            <>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  resetEverything();
                  setConfirmStep(0);
                }}
              >
                Yes, wipe it all
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setConfirmStep(0)}
              >
                Never mind
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
