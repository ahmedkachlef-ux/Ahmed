import { fetchText } from "./fetcher";

export interface SearchHit {
  title: string;
  url: string;
  snippet?: string;
}

/**
 * Free, key-less web search via DuckDuckGo's HTML endpoint.
 * DDG wraps outbound links in /l/?uddg=<encoded>, so we unwrap them.
 */
export async function duckSearch(q: string, limit = 8): Promise<SearchHit[]> {
  const endpoints = [
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
    `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`
  ];

  for (const endpoint of endpoints) {
    const { ok, html } = await fetchText(endpoint, 8000);
    if (!ok || !html) continue;

    const hits: SearchHit[] = [];
    const linkRe =
      /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) && hits.length < limit) {
      const href = unwrapDdg(m[1]);
      const title = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!/^https?:\/\//i.test(href)) continue;
      hits.push({ url: href, title });
    }
    if (hits.length) return hits;
  }

  return [];
}

function unwrapDdg(href: string): string {
  if (href.startsWith("//")) href = "https:" + href;
  try {
    const u = new URL(href);
    const ud = u.searchParams.get("uddg");
    if (ud) return decodeURIComponent(ud);
  } catch {
    /* fallthrough */
  }
  return href;
}
