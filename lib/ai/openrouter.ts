/**
 * Minimal OpenRouter client. OpenRouter exposes an OpenAI-compatible
 * chat-completions endpoint, routes to many backends, and offers several
 * free models (model id suffixed with ":free").
 *
 * Docs: https://openrouter.ai/docs
 */

export interface ORMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ORCallOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}

export const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct:free";

export function openRouterEnabled(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export async function openRouterChat(
  messages: ORMessage[],
  opts: ORCallOptions = {}
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY missing");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 90_000);

  const body: any = {
    model: opts.model ?? OPENROUTER_MODEL,
    messages,
    temperature: opts.temperature ?? 0.25,
    max_tokens: opts.maxTokens ?? 4096
  };
  if (opts.jsonMode) body.response_format = { type: "json_object" };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "authorization": `Bearer ${key}`,
        "content-type": "application/json",
        // Optional headers OpenRouter uses for attribution/ranking.
        "HTTP-Referer":
          process.env.OPENROUTER_REFERRER ?? "https://canvasai.local",
        "X-Title": "CanvasAI BMC Generator"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 400)}`);
    }
    const data: any = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(
        `OpenRouter returned no content: ${JSON.stringify(data).slice(0, 400)}`
      );
    }
    return String(content);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Robustly extract a JSON object from a model response that may be wrapped
 * in markdown fences or preceded by prose.
 */
export function extractJsonObject(raw: string): any {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model output");
  }
  const chunk = text.slice(start, end + 1);
  try {
    return JSON.parse(chunk);
  } catch (e: any) {
    // Try trimming trailing commas (common Llama/Mistral artifact).
    const cleaned = chunk.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(cleaned);
  }
}
