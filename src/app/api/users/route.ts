import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
import { getSession, requireRole, hashPassword } from "@/lib/auth";
import { ActivityLog } from "@/models/ActivityLog";

export async function GET(req: NextRequest) {
  const s = await getSession();
  const guard = requireRole(s, ["admin", "super_admin"]);
  if (guard) return guard;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "";
  const role = searchParams.get("role") || "";
  const gender = searchParams.get("gender") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));

  await connectDB();
  const filter: any = {};
  if (status) filter.status = status;
  if (role) filter.role = role;
  if (gender) filter.gender = gender;
  if (q) filter.$or = [
    { email: { $regex: q, $options: "i" } },
    { fullName: { $regex: q, $options: "i" } },
    { company: { $regex: q, $options: "i" } }
  ];

  const [items, total] = await Promise.all([
    User.find(filter).sort("-createdAt").skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter)
  ]);

  // enrich with current enrollment
  const ids = items.map((i: any) => i._id);
  const enrollments = await Enrollment.find({ user: { $in: ids } }).populate("training").sort("-createdAt").lean();
  const map = new Map<string, any[]>();
  enrollments.forEach((e: any) => {
    const k = String(e.user);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(e);
  });

  const enriched = items.map((u: any) => {
    const list = map.get(String(u._id)) || [];
    const cur = list.find(e => e.status === "accepted") || list[0];
    return {
      ...u,
      passwordHash: undefined, verificationToken: undefined,
      currentTraining: cur?.training?.title || null,
      trainingCode: cur?.training?.code || null,
      trainingCategory: cur?.training?.category || null,
      trainingFormat: cur?.training?.format || null,
      trainerName: cur?.training?.trainer || null,
      trainingStart: cur?.training?.sessions?.[0]?.startDate || null,
      trainingEnd: cur?.training?.sessions?.[0]?.endDate || null,
      enrollmentStatus: cur?.status || null,
      progressPercent: cur?.progress ?? null,
      inTraining: !!cur,
      trainingState: cur ? (cur.status === "completed" ? "completed" : "in_progress") : "none"
    };
  });

  return NextResponse.json({ items: enriched, total, page, limit });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  const guard = requireRole(s, ["admin", "super_admin"]);
  if (guard) return guard;
  const body = await req.json();
  await connectDB();
  if (!body.email || !body.fullName) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  const exists = await User.findOne({ email: String(body.email).toLowerCase() });
  if (exists) return NextResponse.json({ error: "email_taken" }, { status: 409 });
  const passwordHash = body.password ? await hashPassword(body.password) : undefined;
  const [firstName, ...rest] = String(body.fullName).trim().split(/\s+/);
  const u = await User.create({
    ...body, email: String(body.email).toLowerCase(), passwordHash,
    firstName, lastName: rest.join(" "),
    recordId: "REC-" + Date.now().toString(36).toUpperCase(),
    role: s!.role === "super_admin" ? (body.role || "user") : (body.role === "super_admin" ? "user" : (body.role || "user"))
  });
  await ActivityLog.create({ actor: s!.sub, actorRole: s!.role, action: "user_create", target: u.email });
  return NextResponse.json({ ok: true, user: { ...u.toObject(), passwordHash: undefined } });
}
