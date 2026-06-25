import {
  deserializeSession,
  serializeSession,
  type SerializedSession,
  type SessionState,
} from "@/sr/sessionEngine";
import type { Rating } from "@/lib/types";

/**
 * In-progress sessions are persisted to sessionStorage so a page refresh
 * resumes the exact same queue. sessionStorage (not localStorage) is used
 * deliberately: the saved session lives until the tab is closed, matching the
 * idea that a session lasts "until you leave".
 */
const SESSION_KEY = "grindspace:session:v1";

export type PersistedSession = {
  /** Identifies the session params (source/id/topic) it was built for. */
  paramKey: string;
  state: SerializedSession;
  tally: Record<Rating, number>;
};

export function loadSavedSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

export function saveSession(
  paramKey: string,
  state: SessionState,
  tally: Record<Rating, number>,
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedSession = {
      paramKey,
      state: serializeSession(state),
      tally,
    };
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("[grindspace] failed to save session", err);
  }
}

export function clearSavedSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function restoreSessionState(saved: PersistedSession): SessionState {
  return deserializeSession(saved.state);
}
