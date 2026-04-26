import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ActivityLog } from "@/models/ActivityLog";
import { getSession, requireRole } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  const guard = requireRole(s, ["admin", "super_admin"]);
  if (guard) return guard;
  const body = await req.json();
  await connectDB();
  const target = await User.findById(params.id);
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Admins cannot edit super_admins, cannot promote to super_admin
  if (s!.role === "admin") {
    if (target.role === "super_admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (body.role === "super_admin") delete body.role;
  }
  const allow = ["fullName", "email", "phone", "age", "gender", "company", "department", "address", "avatar",
    "language", "theme", "status", "active", "role", "focusTracks", "interests"];
  for (const k of allow) if (k in body) (target as any)[k] = body[k];
  if (body.fullName) {
    const [firstName, ...rest] = String(body.fullName).trim().split(/\s+/);
    target.firstName = firstName; target.lastName = rest.join(" ");
  }
  await target.save();
  await ActivityLog.create({ actor: s!.sub, actorRole: s!.role, action: "user_update", target: target.email, metadata: body });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  const guard = requireRole(s, ["admin", "super_admin"]);
  if (guard) return guard;
  await connectDB();
  const target = await User.findById(params.id);
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (s!.role === "admin" && target.role === "super_admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await User.findByIdAndDelete(params.id);
  await ActivityLog.create({ actor: s!.sub, actorRole: s!.role, action: "user_delete", target: target.email });
  return NextResponse.json({ ok: true });
}
