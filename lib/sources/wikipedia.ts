export interface WikiSummary {
  title: string;
  extract: string;
  url: string;
  description?: string;
  lang: string;
}

/** Wikipedia REST summary. Free, no key. Returns null if disambiguation or 404. */
export async function wikiSummary(
  title: string,
  lang: "en" | "fr" | "ar" = "en"
): Promise<WikiSummary | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title
  )}`;
  try {
    const res = await fetch(url, {
      headers: {
        "accept": "application/json",
        "user-agent": "CanvasAI/0.2 (BMC Generator)"
      }
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (data.type === "disambiguation" || !data.extract) return null;
    return {
      title: data.title,
      extract: data.extract,
      description: data.description,
      lang,
      url:
        data.content_urls?.desktop?.page ??
        `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`
    };
  } catch {
    return null;
  }
}

/** Wikipedia full-text search — used to resolve the canonical page title. */
export async function wikiSearch(
  query: string,
  lang: "en" | "fr" | "ar" = "en",
  limit = 3
): Promise<{ title: string }[]> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&srlimit=${limit}&format=json&origin=*`;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "CanvasAI/0.2 (BMC Generator)" }
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data.query?.search ?? []).map((s: any) => ({ title: s.title }));
  } catch {
    return [];
  }
}
