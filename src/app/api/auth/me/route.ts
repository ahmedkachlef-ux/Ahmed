import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null });
  await connectDB();
  const u = await User.findById(s.sub).lean();
  return NextResponse.json({ user: u ? sanitize(u) : null });
}

function sanitize(u: any) {
  const { passwordHash, verificationToken, ...rest } = u;
  return rest;
}
