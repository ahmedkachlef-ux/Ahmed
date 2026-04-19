import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0B10",
          900: "#11131A",
          800: "#181B24",
          700: "#232634",
          600: "#2E3242",
          500: "#3C4153",
          400: "#6B7080",
          300: "#9AA0B0",
          200: "#C5C9D6",
          100: "#E6E8EF",
          50: "#F4F5F9"
        },
        brand: {
          50: "#EEF4FF",
          100: "#D9E6FF",
          200: "#B2CCFF",
          300: "#84A9FF",
          400: "#5083FF",
          500: "#2D62F5",
          600: "#1E4AD8",
          700: "#183BAE",
          800: "#152F84",
          900: "#10265F"
        },
        confidence: {
          high: "#16A34A",
          mid: "#D97706",
          low: "#DC2626"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)",
        lift: "0 10px 30px -10px rgba(16,24,40,.18)"
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)"
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" }
        },
        pulseSoft: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: ".6" }
        }
      },
      animation: {
        shimmer: "shimmer 1.8s infinite",
        pulseSoft: "pulseSoft 1.6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
