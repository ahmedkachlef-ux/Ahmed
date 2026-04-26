import { connectDB } from "@/lib/db";
import { ActivityLog } from "@/models/ActivityLog";

export default async function LogsPage() {
  await connectDB();
  const items: any[] = await ActivityLog.find({}).sort("-createdAt").limit(200).populate("actor", "fullName email role").lean();
  return (<>
    <h1 className="font-display font-extrabold text-2xl">Activity logs</h1>
    <div className="card overflow-x-auto">
      <table className="table"><thead><tr><th>Date</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead>
        <tbody>{items.map((l: any) => (
          <tr key={l._id}>
            <td className="text-xs">{new Date(l.createdAt).toLocaleString()}</td>
            <td>{l.actor?.fullName || "system"} <span className="text-xs text-ink-500">{l.actor?.email}</span></td>
            <td><span className="chip-muted">{l.action}</span></td>
            <td>{l.target}</td>
          </tr>))}
          {items.length === 0 && <tr><td colSpan={4} className="text-sm text-ink-500">No activity yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </>);
}
