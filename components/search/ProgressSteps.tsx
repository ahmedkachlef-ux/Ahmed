"use client";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Progress } from "../ui/Progress";
import type { ProgressEvent } from "@/lib/types";

const STEP_ORDER: ProgressEvent["step"][] = [
  "started",
  "search",
  "collect",
  "generate",
  "validate",
  "analyze",
  "done"
];

const LABELS: Record<ProgressEvent["step"], string> = {
  started: "Identification",
  search: "Recherche des sources",
  collect: "Collecte & ranking",
  generate: "Génération du BMC",
  validate: "Validation du schéma",
  analyze: "Analyse stratégique",
  done: "Terminé",
  rank: "Ranking",
  error: "Erreur"
};

export function ProgressSteps({
  events,
  current
}: {
  events: ProgressEvent[];
  current: ProgressEvent | null;
}) {
  const reachedIdx = current
    ? STEP_ORDER.indexOf(current.step)
    : -1;

  return (
    <div className="space-y-4">
      <Progress value={current?.percent ?? 0} />
      <ol className="space-y-2">
        {STEP_ORDER.map((step, i) => {
          const done = i < reachedIdx || current?.step === "done";
          const active = i === reachedIdx && current?.step !== "done";
          return (
            <motion.li
              key={step}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 text-sm"
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                  done
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                    : active
                      ? "border-brand-400/50 bg-brand-500/15 text-brand-200"
                      : "border-ink-700 bg-ink-800 text-ink-500"
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="text-[11px]">{i + 1}</span>
                )}
              </div>
              <span className={done || active ? "text-ink-100" : "text-ink-400"}>
                {LABELS[step]}
              </span>
            </motion.li>
          );
        })}
      </ol>

      {current && (
        <p className="text-xs text-ink-400 italic">
          {current.message}
        </p>
      )}

      {events.length > 0 && (
        <details className="mt-2 text-[11px] text-ink-500">
          <summary className="cursor-pointer hover:text-ink-300">
            Journal détaillé ({events.length})
          </summary>
          <ul className="mt-2 space-y-0.5 max-h-40 overflow-auto">
            {events.map((e, i) => (
              <li key={i} className="font-mono">
                <span className="text-ink-600">{e.step}</span> · {e.message}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
