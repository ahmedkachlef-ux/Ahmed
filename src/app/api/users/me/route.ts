import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth";

const ALLOW = new Set(["fullName", "phone", "age", "gender", "company", "department", "address", "avatar", "language", "theme", "focusTracks", "interests", "onboardingCompleted"]);

export async function PATCH(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const update: any = {};
  for (const k of Object.keys(body)) if (ALLOW.has(k)) update[k] = body[k];
  if (update.fullName) {
    const [firstName, ...rest] = String(update.fullName).trim().split(/\s+/);
    update.firstName = firstName; update.lastName = rest.join(" ");
  }
  await connectDB();
  await User.findByIdAndUpdate(s.sub, update);
  return NextResponse.json({ ok: true });
}
