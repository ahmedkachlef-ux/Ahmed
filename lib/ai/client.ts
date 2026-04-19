import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  if (cached) return cached;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  cached = new Anthropic({ apiKey: key });
  return cached;
}

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";
export const EFFORT = (process.env.ANTHROPIC_EFFORT ?? "high") as
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

export function isLiveMode() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
