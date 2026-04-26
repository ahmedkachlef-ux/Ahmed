import "dotenv/config";
import { connectDB } from "./db";
import { User } from "@/models/User";
import { Training } from "@/models/Training";
import { hashPassword } from "./auth";
import { SAMPLE_TRAININGS } from "./sampleData";

async function run() {
  await connectDB();
  const upserts = [
    { email: "super@advancia.training", role: "super_admin", fullName: "Alex Super-Admin", password: "Advancia#2026" },
    { email: "admin@advancia.training", role: "admin", fullName: "Alia Admin", password: "Advancia#2026" },
    { email: "user@advancia.training", role: "user", fullName: "Yusra Learner", password: "Advancia#2026", company: "ADVANCIA", department: "Cloud" }
  ];
  for (const u of upserts) {
    const passwordHash = await hashPassword(u.password);
    await User.updateOne(
      { email: u.email.toLowerCase() },
      {
        $setOnInsert: {
          recordId: "REC-" + Date.now().toString(36).toUpperCase(),
          email: u.email.toLowerCase(), fullName: u.fullName, role: u.role,
          firstName: u.fullName.split(" ")[0], lastName: u.fullName.split(" ").slice(1).join(" "),
          status: "active", active: true, emailVerified: true, authProvider: "password",
          avatar: u.role === "super_admin" ? "robot" : u.role === "admin" ? "owl" : "fox",
          company: (u as any).company, department: (u as any).department, passwordHash
        }
      },
      { upsert: true }
    );
  }
  for (const t of SAMPLE_TRAININGS) {
    await Training.updateOne(
      { slug: t.slug },
      {
        $setOnInsert: {
          code: "T-" + t.slug.toUpperCase().slice(0, 6),
          title: t.title, slug: t.slug, summary: t.summary, description: t.description,
          category: t.category, level: t.level, format: t.format, durationHours: t.durationHours,
          price: t.price, trainer: t.trainer, trainerBio: t.trainerBio, outcomes: t.outcomes,
          modules: t.modules, rating: t.rating, popularity: t.popularity, tags: t.tags,
          state: "published",
          sessions: t.sessions.map(s => ({ ...s, startDate: new Date(s.startDate), endDate: new Date(s.endDate) }))
        }
      },
      { upsert: true }
    );
  }
  console.log("Seed complete.");
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
