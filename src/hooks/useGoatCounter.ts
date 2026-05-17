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
 *  - the snippet wasn't injected (localhost) or hasn't loaded yet
 *  - an adblocker has eaten gc.zgo.at
 *
 * On first mount, count.js may still be loading; we retry once after a
 * short delay so the very first pageview isn't silently dropped.
 */
export function useGoatCounter(): void {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;
    const title = document.title;

    const ping = () => {
      const gc = window.goatcounter;
      if (gc && typeof gc.count === "function") gc.count({ path, title });
    };

    if (window.goatcounter && typeof window.goatcounter.count === "function") {
      ping();
      return;
    }

    // Retry once for the initial mount race against the async script load.
    const t = window.setTimeout(ping, 1000);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.search]);
}
