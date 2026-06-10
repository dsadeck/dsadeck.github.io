import { useEffect } from "react";
import type { Rating } from "@/lib/types";

/**
 * Keyboard shortcuts for the Session page.
 *
 * Bindings:
 *  - `Space` (when not revealed):                       reveal the rating form
 *  - `1` / `2` / `3` / `4` (when revealed):             select Again / Hard / Good / Easy
 *  - `Enter` (when revealed and a rating is selected):  submit the rating
 *  - `Escape` (when revealed):                          collapse the form
 *  - `U` (while an undo window is open):                undo the last saved rating
 *
 * The hook intentionally ignores key events that:
 *  - Originate from a text input, textarea, select, or contentEditable element.
 *    Exception: `Escape` is honoured everywhere so the user can always bail out.
 *  - Carry a Ctrl/Meta/Alt modifier — those almost always belong to the
 *    browser/OS (copy, paste, hard-reload, etc.).
 *
 * The hook is a no-op when `enabled` is false.
 */
export function useSessionShortcuts({
  enabled,
  revealed,
  hasRating,
  onReveal,
  onSelectRating,
  onSubmit,
  onCollapse,
  canUndo = false,
  onUndo,
}: {
  enabled: boolean;
  revealed: boolean;
  hasRating: boolean;
  onReveal: () => void;
  onSelectRating: (rating: Rating) => void;
  onSubmit: () => void;
  onCollapse: () => void;
  canUndo?: boolean;
  onUndo?: () => void;
}): void {
  useEffect(() => {
    if (!enabled) return;

    function handler(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const inEditable = isEditableTarget(e.target);

      if (e.key === "Escape") {
        if (revealed) {
          e.preventDefault();
          onCollapse();
        }
        return;
      }

      if (inEditable) return;

      if ((e.key === "u" || e.key === "U") && canUndo && onUndo) {
        e.preventDefault();
        onUndo();
        return;
      }

      if (!revealed) {
        if (e.key === " " || e.code === "Space") {
          e.preventDefault();
          onReveal();
        }
        return;
      }

      const rating = NUMBER_TO_RATING[e.key];
      if (rating) {
        e.preventDefault();
        onSelectRating(rating);
        return;
      }

      if (e.key === "Enter" && hasRating) {
        e.preventDefault();
        onSubmit();
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    enabled,
    revealed,
    hasRating,
    onReveal,
    onSelectRating,
    onSubmit,
    onCollapse,
    canUndo,
    onUndo,
  ]);
}

const NUMBER_TO_RATING: Record<string, Rating> = {
  "1": "again",
  "2": "hard",
  "3": "good",
  "4": "easy",
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  // `isContentEditable` requires layout in some environments (notably jsdom).
  // Fall back to the raw attribute so the check works in both browser and tests.
  if (target.isContentEditable) return true;
  const ce = target.getAttribute("contenteditable");
  if (ce !== null && ce !== "false") return true;
  return false;
}
