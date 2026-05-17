import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ProgressProvider } from "@/context/ProgressContext";
import { ThemeProvider } from "@/context/ThemeContext";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

// Match the vite.config.ts `base` so React Router's links resolve correctly
// under GitHub Pages project deployments.
const baseUrl = import.meta.env.BASE_URL;
const basename = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter basename={basename || "/"}>
      <ProgressProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ProgressProvider>
    </BrowserRouter>
  </StrictMode>,
);
