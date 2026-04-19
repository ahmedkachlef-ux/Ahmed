#!/usr/bin/env node
/**
 * Smoke-test the pure-logic helpers that don't need the network.
 * Run after `npm install`:  node scripts/test-units.mjs
 */
import { htmlToText, extractTitle } from "../lib/sources/fetcher.ts";
import { extractJsonObject } from "../lib/ai/openrouter.ts";

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failures++;
  } else {
    console.log("ok  :", msg);
  }
}

// htmlToText
const html =
  "<html><head><title>Hi &amp; Hello</title><style>a{}</style></head>" +
  "<body><script>var x=1;</script><h1>Title</h1>" +
  "<p>Line 1</p><p>Line 2 &nbsp;&quot;ok&quot;</p>" +
  "<!-- comment --></body></html>";
const text = htmlToText(html);
assert(!text.includes("var x=1"), "script stripped");
assert(!text.includes("<style>") && !text.includes("a{}"), "style stripped");
assert(!text.includes("<!--"), "comments stripped");
assert(text.includes("Title"), "h1 kept");
assert(text.includes("\"ok\""), "&quot; decoded");
assert(text.includes("&") && text.includes("Hi"), "&amp; decoded");
assert(extractTitle(html) === "Hi & Hello", "extractTitle decodes entities? " + extractTitle(html));

// extractJsonObject — prose-wrapped
const r1 = extractJsonObject('Some preamble\n```json\n{"a":1,"b":[1,2]}\n```\nthanks');
assert(r1.a === 1 && r1.b[1] === 2, "fenced json parsed");

// trailing comma
const r2 = extractJsonObject('{"a":1,"b":2,}');
assert(r2.a === 1 && r2.b === 2, "trailing comma repaired");

// prose + plain json
const r3 = extractJsonObject('Here it is: {"k":"v"} done.');
assert(r3.k === "v", "prose-wrapped json parsed");

process.exit(failures ? 1 : 0);
