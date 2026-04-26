import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  if (!token || !email) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase(), verificationToken: token });
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
  user.emailVerified = true;
  user.verificationToken = undefined;
  await user.save();
  return NextResponse.redirect(new URL("/dashboard?verified=1", req.url));
}
