import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Enrollment } from "@/models/Enrollment";
import { Training } from "@/models/Training";
import { Notification } from "@/models/Notification";
import { ActivityLog } from "@/models/ActivityLog";
import { getSession, requireRole } from "@/lib/auth";
import { SAMPLE_TRAININGS } from "@/lib/sampleData";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await connectDB();
  const filter = ["admin", "super_admin"].includes(session.role) ? {} : { user: session.sub };
  const items = await Enrollment.find(filter).populate("training").populate("user", "fullName email").sort("-createdAt").lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const slug = body.slug as string;
  if (!slug) return NextResponse.json({ error: "missing_slug" }, { status: 400 });
  await connectDB();
  let training = await Training.findOne({ slug });
  if (!training) {
    const sample = SAMPLE_TRAININGS.find(s => s.slug === slug);
    if (!sample) return NextResponse.json({ error: "training_not_found" }, { status: 404 });
    training = await Training.create({
      code: "T-" + slug.toUpperCase().slice(0, 6),
      title: sample.title, slug: sample.slug, summary: sample.summary, description: sample.description,
      cover: sample.cover, category: sample.category, level: sample.level, format: sample.format,
      durationHours: sample.durationHours, price: sample.price, trainer: sample.trainer,
      trainerBio: sample.trainerBio, outcomes: sample.outcomes, modules: sample.modules,
      rating: sample.rating, popularity: sample.popularity, tags: sample.tags,
      sessions: sample.sessions.map(s => ({ ...s, startDate: new Date(s.startDate), endDate: new Date(s.endDate) }))
    });
  }
  const e = await Enrollment.create({ user: session.sub, training: training._id, status: "requested" });
  await Notification.create({ audience: "admin", title: "New enrollment request", message: `${session.email} requested ${training.title}`, link: "/admin/enrollments", type: "info" });
  await ActivityLog.create({ actor: session.sub, actorRole: session.role, action: "enrollment_request", target: training.title });
  return NextResponse.json({ ok: true, enrollment: e });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  const guard = requireRole(session, ["admin", "super_admin"]);
  if (guard) return guard;
  const body = await req.json().catch(() => ({}));
  await connectDB();
  const e = await Enrollment.findById(body.id);
  if (!e) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (body.status) e.status = body.status;
  if (typeof body.progress === "number") e.progress = body.progress;
  await e.save();
  await Notification.create({ user: e.user, audience: "user", title: "Enrollment update", message: `Status: ${e.status}`, link: "/dashboard" });
  await ActivityLog.create({ actor: session!.sub, actorRole: session!.role, action: "enrollment_update", target: String(e._id), metadata: { status: e.status } });
  return NextResponse.json({ ok: true });
}
