import { store } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const analyses = await store().listAnalyses();
  const feedback = await store().listFeedback();

  const live = analyses.filter((a) => a.mode === "live").length;
  const mock = analyses.length - live;
  const avgConf = analyses.length
    ? Math.round(analyses.reduce((s, a) => s + a.globalConfidence, 0) / analyses.length)
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Admin & monitoring</h1>
      <p className="mt-1 mb-6 text-sm text-ink-400">
        Vue d'ensemble des analyses, feedback utilisateurs et qualité des résultats.
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <KPI label="Analyses" value={String(analyses.length)} />
        <KPI label="Live" value={String(live)} tone="success" />
        <KPI label="Mock" value={String(mock)} tone="warning" />
        <KPI label="Confiance moyenne" value={`${avgConf}/100`} tone="brand" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dernières analyses</CardTitle>
          <CardDescription>Triées par date de mise à jour</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-ink-400">
              <tr>
                <th className="pb-2">Entreprise</th>
                <th className="pb-2">Secteur</th>
                <th className="pb-2">Confiance</th>
                <th className="pb-2">Mode</th>
                <th className="pb-2">Mise à jour</th>
              </tr>
            </thead>
            <tbody>
              {analyses.slice(0, 25).map((a) => (
                <tr key={a.id} className="border-t border-ink-800">
                  <td className="py-2">{a.name}</td>
                  <td className="py-2 text-ink-300">{a.sector ?? "—"}</td>
                  <td className="py-2 text-ink-300">{a.globalConfidence}/100</td>
                  <td className="py-2">
                    <Badge tone={a.mode === "live" ? "success" : "warning"}>{a.mode}</Badge>
                  </td>
                  <td className="py-2 text-ink-400">{formatDate(a.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback utilisateur</CardTitle>
          <CardDescription>{feedback.length} retour{feedback.length > 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <p className="text-sm text-ink-400">Aucun feedback pour l'instant.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {feedback.slice(0, 25).map((f) => (
                <li key={f.id} className="rounded-lg border border-ink-700 bg-ink-800/40 p-3">
                  <div className="flex items-center justify-between">
                    <Badge tone="brand">★ {f.rating}/5</Badge>
                    <span className="text-[11px] text-ink-500">{formatDate(f.createdAt)}</span>
                  </div>
                  <div className="mt-1 text-ink-200">{f.comment ?? "—"}</div>
                  <div className="text-[11px] text-ink-500">analysis {f.analysisId}{f.blockId ? ` · bloc ${f.blockId}` : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "brand";
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-[11px] uppercase tracking-widest text-ink-400">{label}</div>
        <div className="mt-1 flex items-baseline justify-between">
          <div className="text-2xl font-semibold text-ink-50">{value}</div>
          <Badge tone={tone}>•</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
