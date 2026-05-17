import { Navigate, Route, Routes } from "react-router-dom";
import { NavBar } from "@/components/NavBar";
import { TodayPage } from "@/pages/TodayPage";
import { CatalogPage } from "@/pages/CatalogPage";
import { ProblemPage } from "@/pages/ProblemPage";
import { SessionPage } from "@/pages/SessionPage";
import { StatsPage } from "@/pages/StatsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { useGoatCounter } from "@/hooks/useGoatCounter";

export default function App() {
  useGoatCounter();
  return (
    <div className="min-h-full">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/problem/:id" element={<ProblemPage />} />
          <Route path="/session" element={<SessionPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Grindspace · MIT · Your data lives only in this browser.
      </footer>
    </div>
  );
}
