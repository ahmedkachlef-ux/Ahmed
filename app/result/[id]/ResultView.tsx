"use client";
import { useState } from "react";
import { BmcCanvas } from "@/components/bmc/Canvas";
import { Block } from "@/components/bmc/Block";
import { SourcesPanel } from "@/components/bmc/SourcesPanel";
import { AnalysisPanel } from "@/components/bmc/AnalysisPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SOURCE_TIERS } from "@/lib/sources/ranking";
import { BLOCK_ORDER, type BlockId, type BmcAnalysis } from "@/lib/types";

export function ResultView({ analysis }: { analysis: BmcAnalysis }) {
  const [active, setActive] = useState<BlockId | null>(null);
  const open = active !== null;

  return (
    <Tabs defaultValue="canvas">
      <div className="mb-4 flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
          <TabsTrigger value="list">Liste</TabsTrigger>
          <TabsTrigger value="analysis">Analyse</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>
        <span className="text-[11px] text-ink-500">
          Cliquez un bloc pour voir justification & sources
        </span>
      </div>

      <TabsContent value="canvas">
        <BmcCanvas
          blocks={analysis.blocks}
          sources={analysis.sources}
          onOpen={setActive}
        />
      </TabsContent>

      <TabsContent value="list">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BLOCK_ORDER.map((id) => (
            <Block
              key={id}
              id={id}
              block={analysis.blocks[id]}
              sources={analysis.sources}
              onOpen={setActive}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="analysis">
        <AnalysisPanel a={analysis} />
      </TabsContent>

      <TabsContent value="sources">
        <Card>
          <CardHeader>
            <CardTitle>Sources collectées ({analysis.sources.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.sources.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-ink-700 bg-ink-800/40 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">[{s.id}]</Badge>
                      <Badge tone="outline">
                        rank {s.rank} · {SOURCE_TIERS[s.rank]?.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-100">{s.title}</p>
                    <p className="text-[11px] text-ink-400">
                      {[s.publisher, s.date, s.category].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs text-brand-300 hover:text-brand-200"
                    >
                      Ouvrir ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      <SourcesPanel
        open={open}
        onClose={() => setActive(null)}
        block={active ? analysis.blocks[active] : null}
        blockId={active}
        sources={analysis.sources}
      />
    </Tabs>
  );
}
