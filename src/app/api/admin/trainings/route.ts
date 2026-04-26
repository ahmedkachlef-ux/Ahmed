import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Training } from "@/models/Training";
import { ActivityLog } from "@/models/ActivityLog";
import { getSession, requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const s = await getSession();
  const guard = requireRole(s, ["admin", "super_admin"]);
  if (guard) return guard;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || ""; const category = searchParams.get("category") || ""; const state = searchParams.get("state") || "";
  await connectDB();
  const filter: any = {};
  if (category) filter.category = category;
  if (state) filter.state = state;
  if (q) filter.$or = [{ title: { $regex: q, $options: "i" } }, { code: { $regex: q, $options: "i" } }];
  const items = await Training.find(filter).sort("-createdAt").lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  const guard = requireRole(s, ["super_admin"]);
  if (guard) return guard;
  const body = await req.json();
  await connectDB();
  body.code = body.code || ("T-" + Date.now().toString(36).toUpperCase());
  body.slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const t = await Training.create(body);
  await ActivityLog.create({ actor: s!.sub, actorRole: s!.role, action: "training_create", target: t.title });
  return NextResponse.json({ ok: true, training: t });
}

export async function PATCH(req: NextRequest) {
  const s = await getSession();
  const guard = requireRole(s, ["super_admin"]);
  if (guard) return guard;
  const body = await req.json();
  await connectDB();
  await Training.findByIdAndUpdate(body._id, body);
  await ActivityLog.create({ actor: s!.sub, actorRole: s!.role, action: "training_update", target: body.title });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const s = await getSession();
  const guard = requireRole(s, ["super_admin"]);
  if (guard) return guard;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await connectDB();
  await Training.findByIdAndDelete(id);
  await ActivityLog.create({ actor: s!.sub, actorRole: s!.role, action: "training_delete", target: String(id) });
  return NextResponse.json({ ok: true });
}
