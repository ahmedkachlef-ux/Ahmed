"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BLOCK_META, BLOCK_ORDER, type BmcAnalysis, type BlockId } from "@/lib/types";

export function EditView({ analysis }: { analysis: BmcAnalysis }) {
  const router = useRouter();
  const [draft, setDraft] = useState<BmcAnalysis>(analysis);
  const [saving, setSaving] = useState(false);

  const updateBlock = (id: BlockId, patch: Partial<typeof draft.blocks[BlockId]>) => {
    setDraft((d) => ({
      ...d,
      blocks: { ...d.blocks, [id]: { ...d.blocks[id], ...patch } }
    }));
  };

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/analyses/${draft.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ blocks: draft.blocks })
    });
    setSaving(false);
    if (res.ok) router.push(`/result/${draft.id}`);
  }

  return (
    <div className="space-y-4">
      {BLOCK_ORDER.map((id) => {
        const b = draft.blocks[id];
        return (
          <Card key={id}>
            <CardHeader>
              <CardTitle>{BLOCK_META[id].fr}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-ink-400">Items (un par ligne)</label>
                <textarea
                  className="mt-1 h-28 w-full rounded-xl border border-ink-700 bg-ink-900/70 p-2 text-sm text-ink-100"
                  value={b.items.join("\n")}
                  onChange={(e) =>
                    updateBlock(id, {
                      items: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-ink-400">Justification</label>
                <textarea
                  className="mt-1 h-20 w-full rounded-xl border border-ink-700 bg-ink-900/70 p-2 text-sm text-ink-100"
                  value={b.justification}
                  onChange={(e) => updateBlock(id, { justification: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-ink-400">Statut</label>
                  <select
                    className="mt-1 h-10 w-full rounded-xl border border-ink-700 bg-ink-900/70 px-2 text-sm text-ink-100"
                    value={b.status}
                    onChange={(e) => updateBlock(id, { status: e.target.value as any })}
                  >
                    <option value="verified">Vérifié</option>
                    <option value="estimated">Estimé</option>
                    <option value="incomplete">Incomplet</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-ink-400">Confiance (0-100)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={b.confidence}
                    onChange={(e) => updateBlock(id, { confidence: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-400">Sources (ids, séparés par virgule)</label>
                  <Input
                    value={b.sources.join(",")}
                    onChange={(e) =>
                      updateBlock(id, {
                        sources: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => router.back()}>Annuler</Button>
        <Button onClick={save} loading={saving}>Sauvegarder</Button>
      </div>
    </div>
  );
}
