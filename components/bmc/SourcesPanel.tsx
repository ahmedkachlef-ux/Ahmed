"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { Badge } from "../ui/Badge";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { BLOCK_META, type BlockId, type BmcBlock, type Source } from "@/lib/types";
import { SOURCE_TIERS } from "@/lib/sources/ranking";
import { Button } from "../ui/Button";

export function SourcesPanel({
  open,
  onClose,
  block,
  blockId,
  sources
}: {
  open: boolean;
  onClose: () => void;
  block: BmcBlock | null;
  blockId: BlockId | null;
  sources: Source[];
}) {
  const linked = block ? sources.filter((s) => block.sources.includes(s.id)) : [];

  return (
    <AnimatePresence>
      {open && block && blockId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-ink-700 bg-ink-900"
          >
            <div className="sticky top-0 flex items-start justify-between gap-2 border-b border-ink-700 bg-ink-900/95 px-5 py-4 backdrop-blur">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-ink-400">
                  {blockId}
                </div>
                <h3 className="text-base font-semibold text-ink-50">
                  {BLOCK_META[blockId].fr}
                </h3>
                <div className="mt-1.5">
                  <ConfidenceBadge score={block.confidence} status={block.status} />
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={onClose} aria-label="Fermer">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <section>
                <h4 className="mb-1.5 text-xs uppercase tracking-wider text-ink-400">
                  Définition
                </h4>
                <p className="text-sm text-ink-200">{BLOCK_META[blockId].definition}</p>
              </section>

              <section>
                <h4 className="mb-1.5 text-xs uppercase tracking-wider text-ink-400">
                  Contenu
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-ink-100">
                  {block.items.map((it, i) => <li key={i}>{it}</li>)}
                </ul>
              </section>

              {block.justification && (
                <section>
                  <h4 className="mb-1.5 text-xs uppercase tracking-wider text-ink-400">
                    Justification
                  </h4>
                  <p className="text-sm text-ink-200 leading-relaxed">{block.justification}</p>
                </section>
              )}

              {block.flags?.length ? (
                <section>
                  <h4 className="mb-1.5 text-xs uppercase tracking-wider text-amber-300">
                    Avertissements
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-amber-200">
                    {block.flags.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </section>
              ) : null}

              <section>
                <h4 className="mb-1.5 text-xs uppercase tracking-wider text-ink-400">
                  Sources rattachées ({linked.length})
                </h4>
                {linked.length === 0 ? (
                  <p className="text-sm text-ink-400 italic">
                    Aucune source rattachée. Le bloc devrait être marqué « incomplet ».
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {linked.map((s) => (
                      <li
                        key={s.id}
                        className="rounded-lg border border-ink-700 bg-ink-800/60 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge tone="brand">[{s.id}]</Badge>
                            <Badge tone="outline">
                              rank {s.rank} · {SOURCE_TIERS[s.rank]?.label}
                            </Badge>
                          </div>
                          {s.url && (
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-ink-300 hover:text-brand-300"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-ink-100">{s.title}</p>
                        <p className="text-[11px] text-ink-400">
                          {[s.publisher, s.date].filter(Boolean).join(" · ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
