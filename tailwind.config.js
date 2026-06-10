/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm-tinted neutral scale ("training notebook" paper/charcoal).
        // Overriding `slate` re-tints the whole app in one place; every
        // component keeps using slate-* tokens.
        slate: {
          50: "#fafaf7",
          100: "#f3f2ee",
          200: "#e5e3dc",
          300: "#d4d1c8",
          400: "#a39f94",
          500: "#767163",
          600: "#5a5548",
          700: "#45413a",
          800: "#2d2a25",
          900: "#1e1c18",
          950: "#141210",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
