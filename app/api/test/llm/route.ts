import { openRouterChat, openRouterEnabled, OPENROUTER_MODEL } from "@/lib/ai/openrouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dev-only endpoint: does a minimal round-trip to OpenRouter to prove the
 * key/network/model all work. Returns the raw reply text or the full error.
 *
 * Hit: /api/test/llm
 */
export async function GET() {
  if (!openRouterEnabled()) {
    return Response.json(
      { ok: false, error: "OPENROUTER_API_KEY not set" },
      { status: 400 }
    );
  }
  const t0 = Date.now();
  try {
    const text = await openRouterChat(
      [
        { role: "system", content: "You are a JSON echo service." },
        {
          role: "user",
          content: 'Reply with JSON: {"ok":true,"ts":"<ISO timestamp>"}'
        }
      ],
      { jsonMode: true, maxTokens: 200, timeoutMs: 30_000 }
    );
    return Response.json({
      ok: true,
      model: OPENROUTER_MODEL,
      durationMs: Date.now() - t0,
      reply: text
    });
  } catch (err: any) {
    return Response.json(
      {
        ok: false,
        model: OPENROUTER_MODEL,
        durationMs: Date.now() - t0,
        error: err?.message ?? String(err)
      },
      { status: 502 }
    );
  }
}
