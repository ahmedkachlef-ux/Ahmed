import Link from "next/link";
import { ArrowRight, ShieldCheck, Layers3, Activity, Languages, FileSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-widest text-brand-200">
            <Sparkles className="h-3 w-3" /> Powered by Claude Opus 4.7
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
            Le <span className="gradient-text">Business Model Canvas</span><br />
            d'une entreprise, en quelques secondes.
          </h1>
          <p className="mt-5 text-base text-ink-300 sm:text-lg">
            Saisissez le nom d'une entreprise. CanvasAI compile les sources publiques fiables,
            structure les 9 blocs du BMC, et livre une analyse stratégique synthétique —
            sans hallucinations, avec scores de confiance et sources rattachées.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/analyze">
              <Button size="lg">
                Analyser une entreprise
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/history">
              <Button size="lg" variant="outline">
                Voir l'historique
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Zéro hallucination">
          Chaque bloc est rattaché à des sources hiérarchisées (officiel → réglementaire → presse).
          Les zones d'incertitude sont clairement marquées.
        </Feature>
        <Feature icon={<Layers3 className="h-5 w-5" />} title="9 blocs respectés">
          Strict respect des définitions canoniques — Partenaires, Activités, Propositions de
          Valeur, Relations, Segments, Ressources, Canaux, Coûts, Revenus.
        </Feature>
        <Feature icon={<Activity className="h-5 w-5" />} title="Analyse stratégique">
          SWOT synthétique, cohérence inter-blocs, innovation lens et recommandations concrètes
          générées avec Claude Opus 4.7 (adaptive thinking).
        </Feature>
        <Feature icon={<FileSearch className="h-5 w-5" />} title="Traçabilité">
          Justification, score de confiance, statut (vérifié / estimé / incomplet) et sources
          consultables pour chaque bloc.
        </Feature>
        <Feature icon={<Languages className="h-5 w-5" />} title="Multilingue">
          Génération en FR, EN ou AR. Comparaison côte à côte de deux entreprises.
        </Feature>
        <Feature icon={<Sparkles className="h-5 w-5" />} title="Édition & export">
          Édition manuelle des blocs, export PDF / PNG / JSON / CSV, timeline des versions.
        </Feature>
      </section>

      <section className="mb-20 rounded-3xl border border-ink-800 bg-ink-900/50 p-8 sm:p-12">
        <div className="grid items-center gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Conçu pour les analystes exigeants</h2>
            <p className="mt-3 text-ink-300">
              Étudiants, consultants, investisseurs, founders : CanvasAI vous donne une vue
              structurée du modèle économique d'une entreprise — comparable, exportable, et
              auditable jusqu'à la source.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ink-200">
              <li>• Pipeline IA orchestré : recherche → ranking → génération → validation → analyse</li>
              <li>• Sources classées en 7 niveaux de fiabilité</li>
              <li>• Mode démo (mock) si vous n'avez pas de clé Anthropic</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-ink-700 bg-ink-950/60 p-6 font-mono text-xs text-ink-300">
            <div className="text-brand-300">$ POST /api/analyze</div>
            <pre className="mt-2 leading-relaxed">{`{
  "company": "Doctolib",
  "country": "France",
  "language": "fr"
}`}</pre>
            <div className="mt-3 text-emerald-300">→ stream</div>
            <pre className="mt-2 leading-relaxed">{`step: search   12%
step: collect  28%
step: generate 58%
step: validate 80%
step: analyze  90%
step: done    100%`}</pre>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  children
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="card-hover">
      <CardContent>
        <div className="flex items-center gap-2 text-brand-300">
          {icon}
          <h3 className="text-sm font-semibold text-ink-100">{title}</h3>
        </div>
        <p className="mt-2 text-sm text-ink-300">{children}</p>
      </CardContent>
    </Card>
  );
}
