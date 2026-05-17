import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    goatcounter?: {
      count: (vars?: { path?: string; title?: string; event?: boolean }) => void;
    };
  }
}

/**
 * Pings GoatCounter on every React Router navigation.
 *
 * The snippet in index.html is loaded with `no_onload: true`, so this hook
 * is the *only* thing that records pageviews — initial mount included.
 * Without it, only the entry HTML hard-load would be counted and SPA
 * navigations would be invisible.
 *
 * No-ops when:
 *  - the snippet wasn't injected (localhost)
 *  - an adblocker has eaten gc.zgo.at (count.js never loads)
 *
 * On first mount, count.js may still be loading. We poll with backoff up
 * to ~6s so the initial pageview survives slow connections, deprioritized
 * async script loads, and PWA cold starts.
 */
export function useGoatCounter(): void {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;
    const title = document.title;

    const tryPing = (): boolean => {
      const gc = window.goatcounter;
      if (gc && typeof gc.count === "function") {
        gc.count({ path, title });
        return true;
      }
      return false;
    };

    if (tryPing()) return;

    let done = false;
    const delays = [100, 300, 700, 1500, 3000];
    const timers: number[] = [];
    delays.forEach((d) => {
      timers.push(
        window.setTimeout(() => {
          if (done) return;
          if (tryPing()) {
            done = true;
            timers.forEach((t) => window.clearTimeout(t));
          }
        }, d),
      );
    });
    return () => {
      done = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [location.pathname, location.search]);
}
