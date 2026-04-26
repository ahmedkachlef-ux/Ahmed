import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { getSession } from "@/lib/auth";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ items: [] });
  await connectDB();
  const audience = s.role === "user" ? ["user", "all"] : s.role === "admin" ? ["admin", "all"] : ["super_admin", "admin", "all"];
  const items = await Notification.find({ $or: [{ user: s.sub }, { audience: { $in: audience } }] }).sort("-createdAt").limit(40).lean();
  return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, read } = await req.json();
  await connectDB();
  await Notification.findByIdAndUpdate(id, { read: !!read });
  return NextResponse.json({ ok: true });
}
