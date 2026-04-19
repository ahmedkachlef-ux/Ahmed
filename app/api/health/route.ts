import { openRouterEnabled, OPENROUTER_MODEL } from "@/lib/ai/openrouter";
import { isLiveMode as anthropicEnabled, MODEL as ANTHROPIC_MODEL } from "@/lib/ai/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint: tells the user which provider will be used and
 * whether the env is wired correctly. Hit `/api/health` in the browser.
 */
export async function GET() {
  const or = openRouterEnabled();
  const an = anthropicEnabled();
  const mode: "openrouter" | "anthropic" | "mock" = or
    ? "openrouter"
    : an
      ? "anthropic"
      : "mock";

  const rawKey = process.env.OPENROUTER_API_KEY ?? "";
  const trimmed = rawKey.trim();

  return Response.json({
    mode,
    model:
      mode === "openrouter"
        ? OPENROUTER_MODEL
        : mode === "anthropic"
          ? ANTHROPIC_MODEL
          : "mock-v1",
    openrouter: {
      detected: or,
      keyLength: rawKey.length,
      trimmedLength: trimmed.length,
      hasWhitespaceIssue: rawKey.length !== trimmed.length,
      startsWithSkOr: trimmed.startsWith("sk-or-")
    },
    anthropic: { detected: an },
    hint:
      mode === "mock"
        ? "Aucune clé détectée. Créez .env.local avec OPENROUTER_API_KEY=sk-or-... puis redémarrez le serveur (Ctrl+C, npm run dev)."
        : mode === "openrouter" && !trimmed.startsWith("sk-or-")
          ? "La clé ne commence pas par 'sk-or-' — vérifiez qu'elle provient bien de https://openrouter.ai/keys."
          : "OK — un provider live est actif."
  });
}
