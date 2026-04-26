import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";

export default async function NotifPage() {
  const s = await getSession();
  if (!s) redirect("/login?next=/dashboard/notifications");
  await connectDB();
  const items: any[] = await Notification.find({ $or: [{ user: s.sub }, { audience: { $in: ["user", "all"] } }] }).sort("-createdAt").lean();
  return (
    <div className="card p-5">
      <h1 className="font-display font-extrabold text-2xl">Notifications</h1>
      <ul className="mt-4 space-y-2">
        {items.map(n => (
          <li key={n._id} className="rounded-xl border border-ink-100 dark:border-ink-800 p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{n.title}</div>
              <span className="text-xs text-ink-500">{new Date(n.createdAt).toLocaleString()}</span>
            </div>
            <div className="text-sm text-ink-500 mt-1">{n.message}</div>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-ink-500">No notifications.</li>}
      </ul>
    </div>
  );
}
