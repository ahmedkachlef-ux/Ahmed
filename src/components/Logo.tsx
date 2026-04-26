"use client";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="ADVANCIA Trainings" className="inline-flex items-center gap-2.5 group">
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l4-4 5 5 9-9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 4h7v7" />
        </svg>
        <span className="absolute -inset-1 rounded-2xl bg-brand-500/20 blur-xl opacity-0 group-hover:opacity-100 transition" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display font-extrabold tracking-tight text-ink-900 dark:text-white">
            ADVANCIA
          </span>
          <span className="block text-[10px] uppercase tracking-[0.22em] text-brand-600 dark:text-brand-300 font-semibold">
            Trainings
          </span>
        </span>
      )}
    </Link>
  );
}
