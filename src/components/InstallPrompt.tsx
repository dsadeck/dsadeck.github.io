import { useEffect, useState } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

const DISMISSED_KEY = "grindspace:install-toast-dismissed";

/** A one-shot toast surfaced on the Today page. */
export function InstallToast() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!canInstall) return;
    const seen = window.localStorage.getItem(DISMISSED_KEY) === "1";
    if (!seen) setHidden(false);
  }, [canInstall]);

  if (hidden || !canInstall) return null;

  return (
    <div className="card flex items-center justify-between gap-3 p-3">
      <p className="text-sm text-slate-700 dark:text-slate-200">
        Install Grindspace for a native-like, offline experience.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={async () => {
            const outcome = await promptInstall();
            if (outcome !== "unavailable") setHidden(true);
          }}
        >
          Install
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            window.localStorage.setItem(DISMISSED_KEY, "1");
            setHidden(true);
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
