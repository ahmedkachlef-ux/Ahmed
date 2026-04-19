import { readFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { openRouterEnabled, OPENROUTER_MODEL } from "@/lib/ai/openrouter";
import { isLiveMode as anthropicEnabled, MODEL as ANTHROPIC_MODEL } from "@/lib/ai/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function exists(p: string): boolean {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Diagnostic endpoint: tells the user which provider will be used and
 * whether the env is wired correctly. Hit `/api/health` in the browser.
 *
 * Also inspects the filesystem to distinguish:
 *   - .env.local missing entirely
 *   - .env.local exists but server wasn't restarted
 *   - .env.local exists but the key name is wrong
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

  const cwd = process.cwd();
  const envLocalPath = join(cwd, ".env.local");
  const envPath = join(cwd, ".env");
  const envLocalExists = exists(envLocalPath);
  const envExists = exists(envPath);

  // Peek inside .env.local to see whether the user put the key there.
  let envLocalKeyState: "missing-file" | "has-key" | "no-key" | "unreadable" =
    "missing-file";
  let envLocalKeyLooksValid = false;
  if (envLocalExists) {
    try {
      const text = readFileSync(envLocalPath, "utf8");
      const match = text.match(/^\s*OPENROUTER_API_KEY\s*=\s*(.*)$/m);
      if (match) {
        const val = match[1].replace(/^["']|["']$/g, "").trim();
        envLocalKeyState = val ? "has-key" : "no-key";
        envLocalKeyLooksValid = val.startsWith("sk-or-");
      } else {
        envLocalKeyState = "no-key";
      }
    } catch {
      envLocalKeyState = "unreadable";
    }
  }

  // Guess what's wrong.
  let hint: string;
  if (mode !== "mock") {
    hint = "OK — un provider live est actif.";
  } else if (!envLocalExists && !envExists) {
    hint =
      "Aucun fichier .env.local trouvé dans " +
      cwd +
      ". Créez-le avec : node scripts/set-openrouter-key.mjs sk-or-v1-VOTRECLE  (puis redémarrez npm run dev).";
  } else if (envLocalExists && envLocalKeyState === "has-key") {
    hint =
      ".env.local contient OPENROUTER_API_KEY mais le serveur ne l'a pas chargé. " +
      "Next.js lit le fichier AU DÉMARRAGE — arrêtez le dev server (Ctrl+C) et relancez 'npm run dev'.";
  } else if (envLocalExists && envLocalKeyState === "no-key") {
    hint =
      ".env.local existe mais ne contient pas la ligne 'OPENROUTER_API_KEY='. " +
      "Ajoutez : OPENROUTER_API_KEY=sk-or-v1-...  puis redémarrez.";
  } else if (envExists && !envLocalExists) {
    hint =
      "Un fichier .env existe mais pas .env.local. Next.js charge les deux, mais .env.local est " +
      "recommandé pour les secrets. Si la clé est dans .env, vérifiez le nom et redémarrez.";
  } else {
    hint = "Configuration ambiguë — consultez les champs files/envLocal ci-dessous.";
  }

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
    files: {
      cwd,
      envLocalExists,
      envExists,
      envLocalPath,
      envLocalKeyState,
      envLocalKeyLooksValid
    },
    hint
  });
}
