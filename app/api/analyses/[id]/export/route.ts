import { NextRequest } from "next/server";
import { store } from "@/lib/storage";
import { BLOCK_META, BLOCK_ORDER } from "@/lib/types";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const a = await store().getAnalysis(params.id);
  if (!a) return new Response("not found", { status: 404 });
  const format = (new URL(req.url).searchParams.get("format") ?? "json").toLowerCase();
  const slug = slugify(a.company.name);

  if (format === "json") {
    return new Response(JSON.stringify(a, null, 2), {
      headers: {
        "content-type": "application/json",
        "content-disposition": `attachment; filename="bmc-${slug}.json"`
      }
    });
  }

  if (format === "csv") {
    const rows = [
      ["block", "items", "justification", "confidence", "status", "sources"]
    ];
    for (const id of BLOCK_ORDER) {
      const b = a.blocks[id];
      rows.push([
        BLOCK_META[id].fr,
        b.items.join(" | "),
        b.justification.replace(/\s+/g, " "),
        String(b.confidence),
        b.status,
        b.sources.join(",")
      ]);
    }
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="bmc-${slug}.csv"`
      }
    });
  }

  if (format === "md") {
    const lines: string[] = [];
    lines.push(`# Business Model Canvas — ${a.company.name}`);
    lines.push("");
    lines.push(`*${a.company.sector ?? ""}${a.company.country ? ` — ${a.company.country}` : ""}*`);
    if (a.company.website) lines.push(`Site: <${a.company.website}>`);
    lines.push("");
    if (a.company.description) lines.push(a.company.description + "\n");

    lines.push("## Résumé exécutif");
    lines.push(a.analysis.summary + "\n");

    for (const id of BLOCK_ORDER) {
      const b = a.blocks[id];
      lines.push(`## ${BLOCK_META[id].fr}`);
      lines.push(`*Confiance: ${b.confidence}/100 — ${b.status}*`);
      lines.push("");
      for (const it of b.items) lines.push(`- ${it}`);
      if (b.justification) {
        lines.push("");
        lines.push(`> ${b.justification}`);
      }
      if (b.sources.length) {
        lines.push("");
        lines.push(`Sources: ${b.sources.map((s) => `\`${s}\``).join(", ")}`);
      }
      lines.push("");
    }

    lines.push("## SWOT");
    lines.push("**Forces:** " + a.analysis.swot.strengths.join("; "));
    lines.push("**Faiblesses:** " + a.analysis.swot.weaknesses.join("; "));
    lines.push("**Opportunités:** " + a.analysis.swot.opportunities.join("; "));
    lines.push("**Menaces:** " + a.analysis.swot.threats.join("; "));
    lines.push("");
    lines.push("## Recommandations");
    a.analysis.recommendations.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
    lines.push("");
    lines.push("## Sources");
    for (const s of a.sources) {
      lines.push(`- **[${s.id}]** (rank ${s.rank} · ${s.category}) ${s.title}${s.url ? ` — <${s.url}>` : ""}`);
    }

    return new Response(lines.join("\n"), {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition": `attachment; filename="bmc-${slug}.md"`
      }
    });
  }

  return new Response("Unsupported format. Use ?format=json|csv|md", { status: 400 });
}
