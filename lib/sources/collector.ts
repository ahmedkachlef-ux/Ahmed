import { duckSearch, type SearchHit } from "./search";
import { wikiSearch, wikiSummary } from "./wikipedia";
import { fetchText } from "./fetcher";
import type { Source } from "../types";

export interface Evidence {
  source: Source;
  text: string;
}

export type CollectProgress = (step: string, msg: string, pct: number) => void;

export interface CollectHints {
  country?: string;
  sector?: string;
  website?: string;
  language?: "fr" | "en" | "ar";
}

/**
 * Gather public evidence about a company from free, key-less sources:
 *   1. Wikipedia (FR + EN summaries)
 *   2. Official website (if provided or discoverable)
 *   3. DuckDuckGo top results for business-model-oriented queries
 *
 * Returns a list of evidence pieces with classified Source metadata.
 * Each piece caps its text at ~6000 chars to keep LLM input tractable.
 */
export async function collectEvidence(
  company: string,
  hints: CollectHints,
  onStep: CollectProgress
): Promise<Evidence[]> {
  const evidence: Evidence[] = [];
  const seenUrls = new Set<string>();
  const lang = hints.language ?? "fr";

  const push = (ev: Evidence) => {
    const key = (ev.source.url ?? ev.source.title).toLowerCase();
    if (seenUrls.has(key)) return;
    seenUrls.add(key);
    evidence.push(ev);
  };

  // 1. Wikipedia — resolve canonical title then fetch summary in both langs.
  onStep("search", `Recherche Wikipédia pour « ${company} »…`, 8);
  const wikiLangs: ("en" | "fr")[] = lang === "fr" ? ["fr", "en"] : ["en", "fr"];
  for (const wl of wikiLangs) {
    let w = await wikiSummary(company, wl);
    if (!w) {
      const hits = await wikiSearch(company, wl, 1);
      if (hits.length) w = await wikiSummary(hits[0].title, wl);
    }
    if (w) {
      push({
        source: {
          id: `wiki_${wl}`,
          title: `Wikipedia (${wl.toUpperCase()}) — ${w.title}`,
          url: w.url,
          publisher: `Wikipedia (${wl})`,
          rank: 6,
          category: "encyclopédie"
        },
        text: [w.description, w.extract].filter(Boolean).join("\n\n")
      });
    }
  }

  // 2. Web search (DuckDuckGo) across several business-model angles.
  onStep("search", `Recherche web (DuckDuckGo) pour « ${company} »…`, 16);
  const queries = [
    `${company} business model`,
    `${company} revenue customers products`,
    hints.sector ? `${company} ${hints.sector}` : `${company} company`,
    `${company} partners suppliers strategy`,
    `${company} about us mission`
  ];

  const hitsMap = new Map<string, SearchHit>();
  for (const q of queries) {
    const results = await duckSearch(q, 6);
    for (const h of results) {
      if (!hitsMap.has(h.url)) hitsMap.set(h.url, h);
    }
    if (hitsMap.size >= 18) break;
  }

  // 3. Rank candidate URLs: official site first, then press/reports, then rest.
  const ranked = Array.from(hitsMap.values())
    .map((h) => {
      const host = safeHost(h.url);
      return { ...h, host, priority: urlPriority(host, company, hints.website) };
    })
    .sort((a, b) => a.priority - b.priority);

  // 4. If user provided a website, prepend a direct fetch of it.
  if (hints.website) {
    const host = safeHost(hints.website);
    ranked.unshift({
      url: hints.website,
      title: `${company} — site officiel`,
      host,
      priority: 0
    } as any);
  }

  const toFetch = ranked.slice(0, 6);
  onStep("collect", `Téléchargement de ${toFetch.length} pages…`, 28);

  const fetched = await Promise.allSettled(toFetch.map((r) => fetchText(r.url, 8000)));

  fetched.forEach((res, i) => {
    if (res.status !== "fulfilled") return;
    const r = res.value;
    if (!r.ok || r.text.length < 200) return;
    const h = toFetch[i];
    const host = safeHost(r.finalUrl) || h.host;
    const { category, rank } = classify(host, r.finalUrl, hints.website);
    push({
      source: {
        id: `web${evidence.length + 1}`,
        title: h.title || host,
        url: r.finalUrl,
        publisher: host,
        rank,
        category
      },
      text: r.text
    });
  });

  onStep("rank", `Classement: ${evidence.length} sources retenues`, 38);
  return evidence;
}

function safeHost(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function urlPriority(host: string, company: string, officialUrl?: string): number {
  const h = host.toLowerCase();
  const c = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (officialUrl) {
    const oh = safeHost(officialUrl);
    if (oh && h.includes(oh)) return 0;
  }
  if (c && h.includes(c)) return 1; // probable official site
  if (/(investor|ir\.|annualreport|sec\.gov|amf-france)/.test(h)) return 2;
  if (/(ft\.com|wsj\.com|bloomberg|reuters|lesechos|lemonde|latribune|techcrunch|financialtimes)/.test(h))
    return 3;
  if (/wikipedia/.test(h)) return 4;
  if (/(crunchbase|pitchbook|statista|tracxn)/.test(h)) return 5;
  return 6;
}

function classify(
  host: string,
  finalUrl: string,
  officialUrl?: string
): { category: string; rank: 1 | 2 | 3 | 4 | 5 | 6 | 7 } {
  const h = host.toLowerCase();
  const u = finalUrl.toLowerCase();
  if (officialUrl) {
    const oh = safeHost(officialUrl);
    if (oh && h.includes(oh)) return { category: "site officiel", rank: 1 };
  }
  if (/(investor|ir\.|annualreport|annual-report|finance\.|shareholders)/.test(u))
    return { category: "rapport annuel", rank: 2 };
  if (/(sec\.gov|amf-france\.org|esma\.europa\.eu|edgar)/.test(h))
    return { category: "document réglementaire", rank: 3 };
  if (/(insee\.fr|companieshouse|opencorporates|sirene)/.test(h))
    return { category: "registre officiel", rank: 4 };
  if (/(press|newsroom|media|communique)/.test(u) && !/\.(com|fr|org)\/blog/.test(u))
    return { category: "communiqué officiel", rank: 5 };
  if (/(ft\.com|wsj\.com|bloomberg|reuters|lesechos|lemonde|latribune|techcrunch|theverge|cnbc|ft\.)/.test(h))
    return { category: "presse économique", rank: 6 };
  if (/(wikipedia|britannica)/.test(h))
    return { category: "encyclopédie", rank: 6 };
  if (/(crunchbase|pitchbook|statista|tracxn|linkedin|glassdoor)/.test(h))
    return { category: "base professionnelle", rank: 7 };
  return { category: "presse / web", rank: 6 };
}
