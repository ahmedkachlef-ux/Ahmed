import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
import { Notification } from "@/models/Notification";
import { Payment } from "@/models/Payment";
import { topRecommendations } from "@/lib/recommend";
import { TrainingCard } from "@/components/TrainingCard";
import { Stars } from "@/components/Stars";
import { AvatarBubble } from "@/components/Avatar";
import Link from "next/link";

export default async function UserDashboard() {
  const s = await getSession();
  if (!s) redirect("/login?next=/dashboard");
  await connectDB();

  const user: any = await User.findById(s.sub).lean();
  const enrollments: any[] = await Enrollment.find({ user: s.sub }).populate("training").sort("-createdAt").lean();
  const notifs: any[] = await Notification.find({ $or: [{ user: s.sub }, { audience: { $in: ["user", "all"] } }] }).sort("-createdAt").limit(8).lean();
  const payments: any[] = await Payment.find({ user: s.sub }).populate("training", "title").sort("-createdAt").limit(8).lean();

  const completion = profileCompleteness(user);
  const current = enrollments.find(e => e.status === "accepted") || enrollments[0];
  const recos = topRecommendations({ department: user?.department, interests: user?.interests, focusTracks: user?.focusTracks }, 3);

  return (
    <>
      <div className="card p-6 flex items-start gap-4">
        <AvatarBubble id={user?.avatar} size={56} />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-extrabold">Welcome back, {user?.firstName || user?.fullName || "learner"}.</h1>
          <p className="text-sm text-ink-500">{user?.company} {user?.department ? `· ${user.department}` : ""}</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="label">Profile completeness</span>
              <span className="font-semibold">{completion}%</span>
            </div>
            <div className="h-2 mt-1 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
              <div className="h-full bg-brand-gradient" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>
        <Link href="/catalogue" className="btn btn-primary">Browse trainings</Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat title="Active enrollments" value={enrollments.filter(e => ["accepted", "requested"].includes(e.status)).length} />
        <Stat title="Completed" value={enrollments.filter(e => e.status === "completed").length} />
        <Stat title="Total spent" value={`$${payments.filter(p => p.status === "paid").reduce((a, p) => a + (p.amount || 0), 0)}`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold">Current training</h2>
            <Link href="/catalogue" className="text-sm text-brand-600">All trainings →</Link>
          </div>
          {current ? (
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl bg-brand-gradient text-white inline-flex items-center justify-center text-xl font-bold">
                {(current.training?.title || "T").slice(0, 1)}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{current.training?.title}</div>
                <div className="text-xs text-ink-500">{current.training?.category} · {current.training?.format}</div>
                <div className="mt-2">
                  <div className="text-xs label">Progress {current.progress || 0}%</div>
                  <div className="h-2 mt-1 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                    <div className="h-full bg-brand-gradient" style={{ width: `${current.progress || 0}%` }} />
                  </div>
                </div>
              </div>
              <span className="chip-brand capitalize">{current.status}</span>
            </div>
          ) : <p className="text-sm text-ink-500">No enrollments yet. Pick a program to start your journey.</p>}
        </div>

        <div className="card p-5">
          <h2 className="font-display font-bold mb-3">Notifications</h2>
          <ul className="space-y-2 max-h-72 overflow-auto">
            {notifs.map(n => (
              <li key={n._id} className="rounded-xl border border-ink-100 dark:border-ink-800 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{n.title}</div>
                  <span className="text-[10px] text-ink-500">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-ink-500 mt-1">{n.message}</div>
              </li>
            ))}
            {notifs.length === 0 && <li className="text-sm text-ink-500">No notifications yet.</li>}
          </ul>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold">Payment history</h2>
          <Link href="/dashboard/payments" className="text-sm text-brand-600">View all →</Link>
        </div>
        <table className="table">
          <thead><tr><th>Date</th><th>Training</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {payments.slice(0, 5).map(p => (
              <tr key={p._id}>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td>{p.training?.title || "—"}</td>
                <td>${p.amount}</td>
                <td><span className="chip-brand">{p.status}</span></td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={4} className="text-ink-500 text-sm">No payments yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display font-bold">Recommended for you <Stars value={4.7} /></h2>
            <p className="text-xs text-ink-500">Based on your department, focus tracks and recent activity.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recos.map(r => <TrainingCard key={r.slug} t={r} />)}
        </div>
      </div>
    </>
  );
}

function Stat({ title, value }: { title: string; value: any }) {
  return (
    <div className="card p-5">
      <div className="label">{title}</div>
      <div className="font-display font-extrabold text-2xl mt-1">{value}</div>
    </div>
  );
}

function profileCompleteness(u: any) {
  if (!u) return 0;
  const fields = ["fullName", "email", "phone", "age", "gender", "company", "department", "avatar", "address"];
  const filled = fields.filter(f => !!u[f] && String(u[f]).length > 0).length;
  return Math.round((filled / fields.length) * 100);
}
