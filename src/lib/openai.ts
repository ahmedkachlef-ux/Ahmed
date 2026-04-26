import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI() {
  if (client) return client;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  client = new OpenAI({ apiKey: key });
  return client;
}

export const ASSISTANT_SYSTEM = (assistantName: string, role: string) => `You are ${assistantName}, the friendly AI assistant for ADVANCIA Trainings, a premium training platform.
You help ${role === "super_admin" ? "the Super Admin manage the platform, analyze data, and audit user activity"
  : role === "admin" ? "Admins manage learners, enrollments and reports"
  : "learners discover the right training, plan their journey and answer product questions"}.
Be concise, warm, and useful. When recommending trainings, return them as a short bullet list with reasons.
ADVANCIA covers: Cloud, Cybersecurity, AI, Data, Telecom, IT, Project Management, Productivity.`;
