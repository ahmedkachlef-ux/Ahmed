import { notFound } from "next/navigation";
import Link from "next/link";
import { Download, Edit3, Globe, Layers } from "lucide-react";
import { store } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ResultView } from "./ResultView";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params
}: {
  params: { id: string };
}) {
  const a = await store().getAnalysis(params.id);
  if (!a) return notFound();

  const blocksArr = Object.values(a.blocks);
  const globalConf = Math.round(
    blocksArr.reduce((s, b) => s + b.confidence, 0) / Math.max(1, blocksArr.length)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <Layers className="h-3.5 w-3.5" />
            BMC · {a.company.sector ?? "secteur n.c."} · {a.company.country ?? "pays n.c."}
            <Badge tone={a.meta.mode === "live" ? "success" : "warning"} className="ml-2">
              {a.meta.mode === "live" ? "Live" : "Mock"}
            </Badge>
            <Badge tone="brand">Confiance globale {globalConf}/100</Badge>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {a.company.name}
          </h1>
          {a.company.website && (
            <a
              href={a.company.website}
              className="mt-1 inline-flex items-center gap-1 text-xs text-brand-300 hover:text-brand-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="h-3 w-3" /> {a.company.website}
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <Link href={`/edit/${a.id}`}>
            <Button variant="secondary" size="sm">
              <Edit3 className="h-4 w-4" /> Éditer
            </Button>
          </Link>
          <a href={`/api/analyses/${a.id}/export?format=json`} download>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" /> JSON
            </Button>
          </a>
          <a href={`/api/analyses/${a.id}/export?format=csv`} download>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" /> CSV
            </Button>
          </a>
          <a href={`/api/analyses/${a.id}/export?format=md`} download>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" /> Rapport (MD)
            </Button>
          </a>
        </div>
      </header>

      {a.company.description && (
        <Card className="mb-6">
          <CardContent className="text-sm text-ink-200">
            {a.company.description}
          </CardContent>
        </Card>
      )}

      <ResultView analysis={a} />
    </div>
  );
}
