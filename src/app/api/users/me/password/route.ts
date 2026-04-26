import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { current, next } = await req.json();
  if (!next || next.length < 8) return NextResponse.json({ error: "weak_password" }, { status: 400 });
  await connectDB();
  const u: any = await User.findById(s.sub);
  if (!u) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (u.passwordHash) {
    const ok = await verifyPassword(current || "", u.passwordHash);
    if (!ok) return NextResponse.json({ error: "wrong_password" }, { status: 400 });
  }
  u.passwordHash = await hashPassword(next);
  await u.save();
  return NextResponse.json({ ok: true });
}
