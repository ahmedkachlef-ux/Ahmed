import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"]
      },
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12"
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617"
        }
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(120deg,#fb923c 0%,#f97316 35%,#ea580c 70%,#c2410c 100%)",
        "warm-radial":
          "radial-gradient(1200px 600px at 80% -10%, rgba(251,146,60,.25), transparent 60%), radial-gradient(900px 500px at -10% 30%, rgba(234,88,12,.18), transparent 60%)"
      },
      boxShadow: {
        glow: "0 10px 40px -12px rgba(234,88,12,0.45)",
        card: "0 10px 30px -12px rgba(15,23,42,0.18)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};
export default config;
