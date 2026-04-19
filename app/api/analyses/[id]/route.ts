import { NextRequest } from "next/server";
import { store } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const a = await store().getAnalysis(params.id);
  if (!a) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(a);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const a = await store().getAnalysis(params.id);
  if (!a) return Response.json({ error: "not found" }, { status: 404 });
  const patch = await req.json();
  const next = {
    ...a,
    ...patch,
    blocks: { ...a.blocks, ...(patch.blocks ?? {}) },
    meta: {
      ...a.meta,
      updatedAt: new Date().toISOString(),
      version: a.meta.version + 1
    }
  };
  await store().saveAnalysis(next);
  return Response.json(next);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await store().deleteAnalysis(params.id);
  return Response.json({ ok: true });
}
