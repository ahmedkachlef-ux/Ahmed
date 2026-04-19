import { NextRequest } from "next/server";
import { store } from "@/lib/storage";
import { shortId } from "@/lib/utils";
import type { Feedback } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.analysisId || !body.rating) {
    return Response.json({ error: "analysisId and rating required" }, { status: 400 });
  }
  const f: Feedback = {
    id: shortId(),
    analysisId: body.analysisId,
    blockId: body.blockId,
    rating: Math.max(1, Math.min(5, Number(body.rating))) as 1 | 2 | 3 | 4 | 5,
    comment: body.comment,
    createdAt: new Date().toISOString()
  };
  await store().saveFeedback(f);
  return Response.json(f);
}

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("analysisId") ?? undefined;
  return Response.json({ items: await store().listFeedback(id) });
}
