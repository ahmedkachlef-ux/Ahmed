import Link from "next/link";
import { store } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const items = await store().listAnalyses();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Historique</h1>
          <p className="mt-1 text-sm text-ink-400">
            {items.length} analyse{items.length > 1 ? "s" : ""} enregistrée{items.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/analyze" className="text-sm text-brand-300 hover:text-brand-200">
          + Nouvelle analyse
        </Link>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center text-sm text-ink-400">
            Aucune analyse pour le moment.{" "}
            <Link href="/analyze" className="text-brand-300 hover:text-brand-200">
              Lancez la première
            </Link>.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((it) => (
            <Link key={it.id} href={`/result/${it.id}`}>
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    {it.name}
                    <Badge tone={it.mode === "live" ? "success" : "warning"}>
                      {it.mode}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-xs text-ink-400">
                  <div>{[it.sector, it.country].filter(Boolean).join(" · ") || "—"}</div>
                  <div>Confiance globale: {it.globalConfidence}/100</div>
                  <div>Mis à jour: {formatDate(it.updatedAt)}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
