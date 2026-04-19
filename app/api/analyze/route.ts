import { NextRequest } from "next/server";
import { runPipeline } from "@/lib/ai/pipeline";
import { store } from "@/lib/storage";
import type { ProgressEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams NDJSON progress events while the pipeline runs, then emits a final
 *   { "type": "result", "id": "<analysisId>" }
 * line so the client can navigate to /result/[id].
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const company = String(body.company ?? "").trim();
  if (!company) {
    return Response.json({ error: "Missing 'company'" }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const emit = (obj: unknown) =>
        controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
      const onProgress = (event: ProgressEvent) =>
        emit({ type: "progress", event });

      try {
        const analysis = await runPipeline(
          {
            company,
            country: body.country,
            sector: body.sector,
            website: body.website,
            language: body.language ?? "fr"
          },
          onProgress
        );
        await store().saveAnalysis(analysis);
        emit({ type: "result", id: analysis.id });
      } catch (err: any) {
        emit({ type: "error", message: err?.message ?? String(err) });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no"
    }
  });
}
