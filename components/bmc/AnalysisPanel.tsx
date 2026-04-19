"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Progress } from "../ui/Progress";
import type { BmcAnalysis } from "@/lib/types";

export function AnalysisPanel({ a }: { a: BmcAnalysis }) {
  const { analysis } = a;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Résumé exécutif</CardTitle>
          <CardDescription>{a.company.name} — modèle économique en bref</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-ink-200 leading-relaxed whitespace-pre-line">
          {analysis.summary}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cohérence inter-blocs</CardTitle>
          <CardDescription>
            Score: {analysis.coherence.score} / 100
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={analysis.coherence.score} className="mb-3" />
          <ul className="list-disc pl-5 space-y-1 text-sm text-ink-200">
            {analysis.coherence.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Innovation lens</CardTitle>
          <CardDescription>
            Signaux détectés ({analysis.innovationLens.score}/100)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={analysis.innovationLens.score} className="mb-3" />
          <ul className="list-disc pl-5 space-y-1 text-sm text-ink-200">
            {analysis.innovationLens.signals.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SWOT synthétique</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <SwotList tone="success" label="Forces" items={analysis.swot.strengths} />
          <SwotList tone="danger" label="Faiblesses" items={analysis.swot.weaknesses} />
          <SwotList tone="brand" label="Opportunités" items={analysis.swot.opportunities} />
          <SwotList tone="warning" label="Menaces" items={analysis.swot.threats} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommandations stratégiques</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-decimal pl-5 space-y-1.5 text-sm text-ink-200">
            {analysis.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function SwotList({
  label,
  items,
  tone
}: {
  label: string;
  items: string[];
  tone: "success" | "danger" | "brand" | "warning";
}) {
  return (
    <div>
      <Badge tone={tone}>{label}</Badge>
      <ul className="mt-2 list-disc pl-5 space-y-1 text-ink-200">
        {items.length ? items.map((it, i) => <li key={i}>{it}</li>) : <li className="text-ink-400 italic">—</li>}
      </ul>
    </div>
  );
}
