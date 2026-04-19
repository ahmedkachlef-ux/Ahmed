import { NextRequest } from "next/server";
import { collectEvidence } from "@/lib/sources/collector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dev-only endpoint: runs the evidence collector without calling any LLM. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  if (!q) return Response.json({ error: "missing ?q" }, { status: 400 });

  const steps: { step: string; msg: string; pct: number }[] = [];
  const evidence = await collectEvidence(
    q,
    {
      country: url.searchParams.get("country") ?? undefined,
      sector: url.searchParams.get("sector") ?? undefined,
      website: url.searchParams.get("website") ?? undefined,
      language: (url.searchParams.get("lang") as any) ?? "fr"
    },
    (step, msg, pct) => steps.push({ step, msg, pct })
  );

  return Response.json({
    count: evidence.length,
    steps,
    evidence: evidence.map((e) => ({
      id: e.source.id,
      rank: e.source.rank,
      category: e.source.category,
      publisher: e.source.publisher,
      title: e.source.title,
      url: e.source.url,
      preview: e.text.slice(0, 200)
    }))
  });
}
