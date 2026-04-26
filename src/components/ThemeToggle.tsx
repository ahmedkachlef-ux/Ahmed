"use client";
import { useApp } from "@/app/providers";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useApp();
  const dark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 dark:border-ink-700 hover:border-brand-400 transition-colors"
    >
      <motion.span
        key={dark ? "moon" : "sun"}
        initial={{ rotate: -45, opacity: 0, scale: .8 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="block"
      >
        {dark ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-300" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
          </svg>
        )}
      </motion.span>
    </button>
  );
}
