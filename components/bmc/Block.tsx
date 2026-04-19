"use client";
import { motion } from "framer-motion";
import { BLOCK_META, type BmcBlock, type BlockId, type Source } from "@/lib/types";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { cn } from "@/lib/utils";

export function Block({
  id,
  block,
  sources,
  onOpen,
  className,
  compact = false
}: {
  id: BlockId;
  block: BmcBlock;
  sources: Source[];
  onOpen?: (id: BlockId) => void;
  className?: string;
  compact?: boolean;
}) {
  const meta = BLOCK_META[id];
  const linked = sources.filter((s) => block.sources.includes(s.id));

  return (
    <motion.button
      type="button"
      onClick={() => onOpen?.(id)}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn(
        "card card-hover relative flex h-full w-full flex-col items-stretch gap-2 p-4 text-left",
        "focus:outline-none focus:ring-2 focus:ring-brand-400/40",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-ink-400">
            {id}
          </div>
          <div className="text-sm font-semibold text-ink-100 leading-tight">
            {meta.fr}
          </div>
        </div>
        <ConfidenceBadge score={block.confidence} status={block.status} />
      </div>

      <ul className={cn(
        "list-disc pl-4 text-[13px] text-ink-200 space-y-1",
        compact && "line-clamp-6"
      )}>
        {block.items.slice(0, compact ? 4 : 8).map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>

      {!compact && block.justification && (
        <p className="text-[11px] text-ink-400 italic line-clamp-3">
          {block.justification}
        </p>
      )}

      {linked.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {linked.slice(0, 4).map((s) => (
            <span
              key={s.id}
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-ink-800 text-ink-300 border border-ink-700"
              title={s.title}
            >
              [{s.id}] r{s.rank}
            </span>
          ))}
          {linked.length > 4 && (
            <span className="text-[10px] text-ink-400">+{linked.length - 4}</span>
          )}
        </div>
      )}
    </motion.button>
  );
}
