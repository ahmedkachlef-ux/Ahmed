const UA =
  "Mozilla/5.0 (compatible; CanvasAI/0.2; +https://github.com/ahmedkachlef-ux/Ahmed)";

export interface FetchResult {
  ok: boolean;
  status: number;
  text: string;
  html: string;
  finalUrl: string;
}

/** Fetch a URL, follow redirects, and return both raw HTML and plain text. */
export async function fetchText(url: string, timeoutMs = 8000): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": UA,
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "fr,en;q=0.8"
      }
    });
    const html = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      html,
      text: htmlToText(html, 6000),
      finalUrl: res.url
    };
  } catch {
    return { ok: false, status: 0, html: "", text: "", finalUrl: url };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Minimal HTML-to-text. Strips <script>/<style>/<noscript>, drops tags,
 * decodes a handful of entities, collapses whitespace.
 */
export function htmlToText(html: string, maxLen = 6000): string {
  if (!html) return "";
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<\/?(br|p|li|div|tr|h[1-6])[^>]*>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
  s = s.replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim();
  return s.slice(0, maxLen);
}

/** Extract the page's <title> if present. */
export function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}
