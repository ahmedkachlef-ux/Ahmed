import { bmcResponseSchema, type BmcResponse } from "../bmc-schema";
import { BLOCK_ORDER } from "../types";
import { inferRank } from "../sources/ranking";

/**
 * Parse a raw JSON string / object returned by the model, repair small issues
 * (missing blocks, bad rank), and validate via Zod.
 */
export function parseAndRepair(raw: unknown): BmcResponse {
  const obj: any = typeof raw === "string" ? JSON.parse(raw) : raw;

  // Ensure all 9 blocks exist.
  obj.blocks = obj.blocks ?? {};
  for (const id of BLOCK_ORDER) {
    const b = obj.blocks[id];
    if (!b) {
      obj.blocks[id] = {
        id,
        items: ["Information insuffisante"],
        justification: "Bloc non renseigné — données publiques insuffisantes.",
        sources: [],
        confidence: 0,
        status: "incomplete",
        flags: ["missing_from_model_output"]
      };
      continue;
    }
    b.id = id;
    b.items = Array.isArray(b.items) && b.items.length ? b.items : ["—"];
    b.justification = b.justification || "";
    b.sources = Array.isArray(b.sources) ? b.sources : [];
    b.confidence = typeof b.confidence === "number" ? clampScore(b.confidence) : 0;
    if (!["verified", "estimated", "incomplete"].includes(b.status)) {
      b.status = b.confidence >= 75 ? "verified" : b.confidence >= 45 ? "estimated" : "incomplete";
    }
  }

  // Ensure sources have a valid rank.
  obj.sources = Array.isArray(obj.sources) ? obj.sources : [];
  obj.sources = obj.sources.map((s: any, i: number) => ({
    id: s.id || `s${i + 1}`,
    title: s.title || "Source sans titre",
    url: s.url,
    publisher: s.publisher,
    date: s.date,
    rank: clampRank(s.rank ?? inferRank(s.category ?? "")),
    category: s.category || "autre"
  }));

  // Fill analysis defaults.
  obj.analysis = obj.analysis ?? {};
  obj.analysis.summary = obj.analysis.summary || "";
  obj.analysis.swot = obj.analysis.swot ?? {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: []
  };
  obj.analysis.coherence = obj.analysis.coherence ?? { score: 0, notes: [] };
  obj.analysis.innovationLens = obj.analysis.innovationLens ?? { score: 0, signals: [] };
  obj.analysis.recommendations = Array.isArray(obj.analysis.recommendations)
    ? obj.analysis.recommendations
    : [];

  return bmcResponseSchema.parse(obj);
}

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clampRank(n: any): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const r = Math.max(1, Math.min(7, Math.round(Number(n) || 7)));
  return r as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/** Check that every block references at least one existing source id. */
export function coherenceWarnings(bmc: BmcResponse): string[] {
  const ids = new Set(bmc.sources.map((s) => s.id));
  const warnings: string[] = [];
  for (const id of BLOCK_ORDER) {
    const b = (bmc.blocks as any)[id];
    if (b.status === "verified" && !b.sources.some((s: string) => ids.has(s))) {
      warnings.push(`Le bloc ${id} est marqué "vérifié" mais ne référence aucune source existante.`);
    }
    const unknown = b.sources.filter((s: string) => !ids.has(s));
    if (unknown.length) {
      warnings.push(`Bloc ${id}: sources introuvables → ${unknown.join(", ")}`);
    }
  }
  return warnings;
}

/** Extract text content from a Claude API Message response. */
export function extractText(message: any): string {
  const blocks = message?.content ?? [];
  return blocks
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");
}
