import * as React from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-800 text-ink-200 border-ink-700",
  brand: "bg-brand-500/15 text-brand-200 border-brand-400/30",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  danger: "bg-red-500/15 text-red-300 border-red-500/30",
  outline: "bg-transparent text-ink-200 border-ink-600"
};

export function Badge({
  className,
  tone = "neutral",
  children,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tones[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
