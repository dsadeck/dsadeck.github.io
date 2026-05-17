import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // Deployed at https://dsadeck.github.io (org-site, served from root).
  // Override via GRINDSPACE_BASE for project-site or sub-path hosting,
  // e.g. `GRINDSPACE_BASE=/grindspace/ npm run build` for project pages.
  base: command === "build" ? (process.env.GRINDSPACE_BASE ?? "/") : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest: {
        name: "Grindspace",
        short_name: "Grindspace",
        description: "Spaced repetition for the NeetCode 150",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: ".",
        // For full installability across Safari/Android, drop real PNGs into
        // public/ at 192x192 and 512x512 and add them to this array. The SVG
        // alone is enough for Chromium-based desktop installs.
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,json,woff2}"],
        // Workbox's terser pass can hang on Node 18; ship an unminified SW
        // until we move the dev environment to Node 20.
        mode: "development",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
}));
