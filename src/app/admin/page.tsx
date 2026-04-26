import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
import { Training } from "@/models/Training";
import { Notification } from "@/models/Notification";
import { AreaTrend, BarsByCategory, StatusPie } from "@/components/Charts";
import Link from "next/link";

export default async function AdminOverview() {
  await connectDB();
  const [users, enrollments, trainings, notifs] = await Promise.all([
    User.find({}).lean(), Enrollment.find({}).lean(), Training.find({}).lean(),
    Notification.find({ audience: { $in: ["admin", "all"] } }).sort("-createdAt").limit(8).lean()
  ]);

  const trend = trendByMonth(enrollments);
  const byCategory = countBy(trainings, (t: any) => t.category);
  const statusPie = countBy(enrollments, (e: any) => e.status);
  const learners = users.filter((u: any) => u.role === "user");

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-3xl">Admin overview</h1>
          <p className="text-sm text-ink-500">Operational pulse of the platform.</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn btn-outline" href="/admin/exports">Exports</Link>
          <Link className="btn btn-primary" href="/admin/users">Manage learners</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Kpi title="Total learners" value={learners.length} hint={`${users.filter((u: any) => u.active !== false).length} active`} />
        <Kpi title="Enrollments" value={enrollments.length} hint={`${enrollments.filter((e: any) => e.status === "requested").length} pending`} />
        <Kpi title="Published trainings" value={trainings.filter((t: any) => t.state === "published").length} />
        <Kpi title="Completion rate" value={`${completionRate(enrollments)}%`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-display font-bold mb-2">Enrollments trend</h2>
          <AreaTrend data={trend} />
        </div>
        <div className="card p-5">
          <h2 className="font-display font-bold mb-2">Status</h2>
          <StatusPie data={statusPie.map(([name, value]) => ({ name, value }))} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-display font-bold mb-2">Trainings by category</h2>
          <BarsByCategory data={byCategory.map(([name, value]) => ({ name, value }))} />
        </div>
        <div className="card p-5">
          <h2 className="font-display font-bold mb-2">Notifications</h2>
          <ul className="space-y-2 max-h-72 overflow-auto">
            {notifs.map((n: any) => (
              <li key={n._id} className="text-sm rounded-xl border border-ink-100 dark:border-ink-800 p-3">
                <div className="font-semibold">{n.title}</div>
                <div className="text-ink-500">{n.message}</div>
              </li>
            ))}
            {notifs.length === 0 && <li className="text-sm text-ink-500">All clear.</li>}
          </ul>
        </div>
      </div>
    </>
  );
}

function Kpi({ title, value, hint }: { title: string; value: any; hint?: string }) {
  return (
    <div className="card p-5">
      <div className="label">{title}</div>
      <div className="font-display font-extrabold text-3xl mt-1">{value}</div>
      {hint && <div className="text-xs text-ink-500 mt-1">{hint}</div>}
    </div>
  );
}

function trendByMonth(items: any[]) {
  const m = new Map<string, number>();
  items.forEach(i => {
    const k = new Date(i.createdAt || Date.now()).toLocaleString(undefined, { month: "short" });
    m.set(k, (m.get(k) || 0) + 1);
  });
  if (m.size === 0) ["Jan","Feb","Mar","Apr","May"].forEach((mo, i) => m.set(mo, [4,8,6,12,9][i]));
  return [...m.entries()].map(([name, value]) => ({ name, value }));
}
function countBy<T>(arr: T[], key: (x: T) => string): [string, number][] {
  const m = new Map<string, number>();
  arr.forEach(x => { const k = key(x); m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()];
}
function completionRate(en: any[]) {
  if (en.length === 0) return 0;
  return Math.round((en.filter(e => e.status === "completed").length / en.length) * 100);
}
