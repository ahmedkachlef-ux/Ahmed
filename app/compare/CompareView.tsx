"use client";
import { useEffect, useState } from "react";
import { BmcCanvas } from "@/components/bmc/Canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { AnalysisSummary, BmcAnalysis } from "@/lib/types";

export function CompareView({ items }: { items: AnalysisSummary[] }) {
  const [leftId, setLeftId] = useState(items[0]?.id ?? "");
  const [rightId, setRightId] = useState(items[1]?.id ?? items[0]?.id ?? "");
  const [left, setLeft] = useState<BmcAnalysis | null>(null);
  const [right, setRight] = useState<BmcAnalysis | null>(null);

  useEffect(() => {
    if (leftId) fetch(`/api/analyses/${leftId}`).then((r) => r.json()).then(setLeft);
  }, [leftId]);
  useEffect(() => {
    if (rightId) fetch(`/api/analyses/${rightId}`).then((r) => r.json()).then(setRight);
  }, [rightId]);

  if (!items.length) {
    return (
      <Card>
        <CardContent className="text-sm text-ink-400">
          Aucune analyse à comparer. Lancez d'abord deux analyses.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={leftId}
          onChange={(e) => setLeftId(e.target.value)}
          className="h-10 rounded-xl border border-ink-700 bg-ink-900/70 px-3 text-sm"
        >
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
        <select
          value={rightId}
          onChange={(e) => setRightId(e.target.value)}
          className="h-10 rounded-xl border border-ink-700 bg-ink-900/70 px-3 text-sm"
        >
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Side a={left} />
        <Side a={right} />
      </div>
    </div>
  );
}

function Side({ a }: { a: BmcAnalysis | null }) {
  if (!a) return <div className="text-sm text-ink-400">Chargement…</div>;
  return (
    <div>
      <Card className="mb-3">
        <CardHeader>
          <CardTitle>{a.company.name}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-ink-300 space-y-1">
          <div>{[a.company.sector, a.company.country].filter(Boolean).join(" · ") || "—"}</div>
          <div className="line-clamp-3 text-ink-400">{a.analysis.summary}</div>
        </CardContent>
      </Card>
      <BmcCanvas blocks={a.blocks} sources={a.sources} />
    </div>
  );
}
