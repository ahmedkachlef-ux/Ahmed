import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
import { Training } from "@/models/Training";
import { Payment } from "@/models/Payment";
import { ActivityLog } from "@/models/ActivityLog";
import { AreaTrend, BarsByCategory, StatusPie } from "@/components/Charts";

export default async function SuperOverview() {
  await connectDB();
  const [users, en, tr, payments, logs] = await Promise.all([
    User.find({}).lean(), Enrollment.find({}).lean(), Training.find({}).lean(),
    Payment.find({}).lean(), ActivityLog.find({}).sort("-createdAt").limit(12).lean()
  ]);
  const revenue = payments.filter((p: any) => p.status === "paid").reduce((a, p: any) => a + (p.amount || 0), 0);
  const trend = trendByMonth(en);
  const byCat = countBy(tr, (t: any) => t.category);
  const roles = countBy(users, (u: any) => u.role);

  return (
    <>
      <div>
        <h1 className="font-display font-extrabold text-3xl">Super Admin overview</h1>
        <p className="text-sm text-ink-500">Strategic visibility across the entire platform.</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <Kpi title="Users" value={users.length} hint={`${users.filter((u: any) => u.role === "admin").length} admins · ${users.filter((u: any) => u.role === "super_admin").length} super`} />
        <Kpi title="Trainings" value={tr.length} />
        <Kpi title="Enrollments" value={en.length} />
        <Kpi title="Revenue" value={`$${revenue.toLocaleString()}`} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2"><h3 className="font-display font-bold mb-2">Enrollment trend</h3><AreaTrend data={trend} /></div>
        <div className="card p-5"><h3 className="font-display font-bold mb-2">Roles</h3><StatusPie data={roles.map(([n, v]) => ({ name: n, value: v }))} /></div>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2"><h3 className="font-display font-bold mb-2">Trainings by category</h3><BarsByCategory data={byCat.map(([n, v]) => ({ name: n, value: v }))} /></div>
        <div className="card p-5">
          <h3 className="font-display font-bold mb-2">Recent activity</h3>
          <ul className="space-y-2 max-h-72 overflow-auto">
            {logs.map((l: any) => (
              <li key={l._id} className="text-sm">
                <span className="chip-muted">{l.action}</span>
                <span className="ms-2 text-ink-500">{l.target}</span>
                <span className="ms-2 text-xs text-ink-400">{new Date(l.createdAt).toLocaleString()}</span>
              </li>
            ))}
            {logs.length === 0 && <li className="text-sm text-ink-500">No activity recorded.</li>}
          </ul>
        </div>
      </div>
    </>
  );
}

function Kpi({ title, value, hint }: any) {
  return (<div className="card p-5"><div className="label">{title}</div><div className="font-display font-extrabold text-3xl mt-1">{value}</div>{hint && <div className="text-xs text-ink-500 mt-1">{hint}</div>}</div>);
}
function trendByMonth(items: any[]) {
  const m = new Map<string, number>();
  items.forEach(i => {
    const k = new Date(i.createdAt || Date.now()).toLocaleString(undefined, { month: "short" });
    m.set(k, (m.get(k) || 0) + 1);
  });
  if (m.size === 0) ["Jan","Feb","Mar","Apr","May"].forEach((mo, i) => m.set(mo, [3,9,7,12,15][i]));
  return [...m.entries()].map(([name, value]) => ({ name, value }));
}
function countBy<T>(arr: T[], key: (x: T) => string): [string, number][] {
  const m = new Map<string, number>();
  arr.forEach(x => { const k = key(x); m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()];
}
