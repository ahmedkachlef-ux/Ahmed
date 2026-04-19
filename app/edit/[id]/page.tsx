import { notFound } from "next/navigation";
import { store } from "@/lib/storage";
import { EditView } from "./EditView";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: { id: string } }) {
  const a = await store().getAnalysis(params.id);
  if (!a) return notFound();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Édition — {a.company.name}</h1>
      <p className="mb-6 mt-1 text-sm text-ink-400">
        Modifiez les blocs du BMC et sauvegardez. Les versions sont historisées.
      </p>
      <EditView analysis={a} />
    </div>
  );
}
