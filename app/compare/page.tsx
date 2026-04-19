import { store } from "@/lib/storage";
import { CompareView } from "./CompareView";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const items = await store().listAnalyses();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Comparer deux entreprises</h1>
      <p className="mt-1 mb-6 text-sm text-ink-400">
        Sélectionnez deux analyses dans votre historique pour les afficher côte à côte.
      </p>
      <CompareView items={items} />
    </div>
  );
}
