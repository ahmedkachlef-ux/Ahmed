import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ActivityLog } from "@/models/ActivityLog";
import { hashPassword, setSession } from "@/lib/auth";
import { randomBytes } from "crypto";

const Body = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  age: z.coerce.number().int().min(13).max(120).optional(),
  gender: z.enum(["male", "female", "other", "unspecified"]).optional(),
  company: z.string().optional(),
  department: z.string().optional(),
  password: z.string().min(8),
  avatar: z.string().optional()
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid", details: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  await connectDB();

  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) return NextResponse.json({ error: "email_taken" }, { status: 409 });

  const [firstName, ...rest] = data.fullName.trim().split(/\s+/);
  const lastName = rest.join(" ");
  const passwordHash = await hashPassword(data.password);
  const verificationToken = randomBytes(20).toString("hex");
  const recordId = "REC-" + Date.now().toString(36).toUpperCase();

  const user = await User.create({
    recordId,
    fullName: data.fullName,
    firstName,
    lastName,
    email: data.email.toLowerCase(),
    age: data.age,
    gender: data.gender || "unspecified",
    company: data.company,
    department: data.department,
    passwordHash,
    avatar: data.avatar || "fox",
    role: "user",
    status: "active",
    authProvider: "password",
    emailVerified: false,
    verificationToken
  });

  await ActivityLog.create({
    actor: user._id, actorRole: "user", action: "register",
    target: user.email, metadata: { provider: "password" }
  });

  await setSession({ sub: String(user._id), email: user.email, role: user.role, name: user.fullName });

  const verifyUrl = `${process.env.APP_URL || ""}/verify?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;
  return NextResponse.json({ ok: true, verifyUrl, user: { id: user._id, email: user.email, role: user.role } });
}
