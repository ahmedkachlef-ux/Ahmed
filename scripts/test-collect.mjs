#!/usr/bin/env node
/**
 * Dev utility: run the evidence collector on a company and print a summary.
 * Usage: node scripts/test-collect.mjs "Doctolib"
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Use ts-node-free loader isn't bundled here; instead, import via tsx if available.
// Fallback: compile on the fly via esbuild -> not available. Simplest: call the
// Next.js dev endpoint we expose for this below.

const company = process.argv[2] ?? "Doctolib";
const base = process.env.TEST_BASE ?? "http://localhost:3000";

const res = await fetch(`${base}/api/test/collect?q=${encodeURIComponent(company)}`);
if (!res.ok) {
  console.error("HTTP", res.status, await res.text());
  process.exit(1);
}
const data = await res.json();
console.log(`Evidence collected: ${data.count} pieces`);
for (const e of data.evidence) {
  console.log(`  [${e.id}] rank=${e.rank} (${e.category}) — ${e.publisher}`);
  console.log(`    ${e.title}`);
  console.log(`    ${e.url ?? "(no url)"}`);
  console.log(`    preview: ${e.preview}…`);
  console.log("");
}
