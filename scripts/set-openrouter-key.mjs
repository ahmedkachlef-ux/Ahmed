#!/usr/bin/env node
/**
 * One-shot helper: writes OPENROUTER_API_KEY to .env.local.
 * Avoids the classic Windows trap where Notepad saves as .env.local.txt.
 *
 * Usage:
 *   node scripts/set-openrouter-key.mjs sk-or-v1-XXXXXXXXXXXXXXXXXXXX
 *
 * Then restart the dev server:
 *   npm run dev
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const key = (process.argv[2] ?? "").trim().replace(/^["']|["']$/g, "");

if (!key) {
  console.error("Usage: node scripts/set-openrouter-key.mjs sk-or-v1-...");
  process.exit(1);
}
if (!key.startsWith("sk-or-")) {
  console.error(
    `ERROR: key should start with "sk-or-". Got prefix: "${key.slice(0, 8)}..."`
  );
  console.error("Get one at https://openrouter.ai/keys");
  process.exit(1);
}

const path = resolve(process.cwd(), ".env.local");
let content = "";
if (existsSync(path)) {
  content = readFileSync(path, "utf8");
  if (/^\s*OPENROUTER_API_KEY\s*=/m.test(content)) {
    content = content.replace(
      /^\s*OPENROUTER_API_KEY\s*=.*$/m,
      `OPENROUTER_API_KEY=${key}`
    );
  } else {
    if (!content.endsWith("\n")) content += "\n";
    content += `OPENROUTER_API_KEY=${key}\n`;
  }
} else {
  content = `OPENROUTER_API_KEY=${key}\n`;
}

writeFileSync(path, content, "utf8");
console.log(`✓ Wrote OPENROUTER_API_KEY to ${path}`);
console.log("  Next step: stop the dev server (Ctrl+C) and run 'npm run dev' again.");
