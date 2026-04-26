import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ActivityLog } from "@/models/ActivityLog";
import { setSession, verifyPassword } from "@/lib/auth";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await connectDB();
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (!user || !user.passwordHash) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  if (user.status === "suspended" || !user.active) return NextResponse.json({ error: "account_suspended" }, { status: 403 });

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

  user.lastLogin = new Date();
  await user.save();

  await ActivityLog.create({ actor: user._id, actorRole: user.role, action: "login", target: user.email });

  await setSession({ sub: String(user._id), email: user.email, role: user.role, name: user.fullName });
  return NextResponse.json({ ok: true, role: user.role });
}
