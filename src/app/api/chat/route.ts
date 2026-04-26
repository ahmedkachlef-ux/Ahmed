import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, ASSISTANT_SYSTEM } from "@/lib/openai";
import { getSession } from "@/lib/auth";
import { topRecommendations } from "@/lib/recommend";
import { safeConnect } from "@/lib/db";
import { User } from "@/models/User";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export async function POST(req: NextRequest) {
  const session = await getSession();
  const assistant = session?.role === "super_admin" ? "Alex" : "Alexa";
  const body = await req.json().catch(() => ({}));
  const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...messages].reverse().find(m => m.role === "user")?.content || "";

  let user: any = null;
  if (session) {
    const conn = await safeConnect();
    if (conn) user = await User.findById(session.sub).lean();
  }

  // Always compute recommendations to enrich the answer
  const recos = topRecommendations({
    department: user?.department,
    interests: user?.interests,
    focusTracks: user?.focusTracks,
    searchHistory: lastUser ? [lastUser] : []
  }, 4);
  const recosBlock = recos.map(r => `- **${r.title}** (${r.category}, ${r.level}, ${r.format}, ${r.durationHours}h, ⭐${r.rating}) — match score ${r.score}`).join("\n");

  const ai = getOpenAI();
  if (!ai) {
    const fallback = `Hi! I'm ${assistant} (offline mode). Based on your context, here are trainings I'd recommend:\n\n${recosBlock}\n\nTip: connect an OPENAI_API_KEY to enable full conversational answers.`;
    return NextResponse.json({ assistant, reply: fallback, recommendations: recos });
  }

  const sys = ASSISTANT_SYSTEM(assistant, session?.role || "user");
  const enriched: ChatMessage[] = [
    { role: "system", content: sys },
    { role: "system", content: `Personalized recommendations to consider:\n${recosBlock}` },
    ...messages.slice(-12)
  ];

  try {
    const completion = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: enriched,
      temperature: 0.6
    });
    const reply = completion.choices[0]?.message?.content || `I'm here. ${recosBlock}`;
    return NextResponse.json({ assistant, reply, recommendations: recos });
  } catch (e: any) {
    return NextResponse.json({
      assistant,
      reply: `I had trouble reaching the model. Here are some good picks meanwhile:\n\n${recosBlock}`,
      recommendations: recos
    });
  }
}
