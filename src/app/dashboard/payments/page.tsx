import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Payment } from "@/models/Payment";

export default async function PaymentsPage() {
  const s = await getSession();
  if (!s) redirect("/login?next=/dashboard/payments");
  await connectDB();
  const items: any[] = await Payment.find({ user: s.sub }).populate("training", "title").sort("-createdAt").lean();

  return (
    <div className="card p-5">
      <h1 className="font-display font-extrabold text-2xl">Payment history</h1>
      <table className="table mt-4">
        <thead><tr><th>Date</th><th>Reference</th><th>Training</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
          {items.map(p => (
            <tr key={p._id}>
              <td>{new Date(p.createdAt).toLocaleString()}</td>
              <td className="font-mono text-xs">{p.reference || `PAY-${String(p._id).slice(-6).toUpperCase()}`}</td>
              <td>{p.training?.title || "—"}</td>
              <td className="capitalize">{p.method}</td>
              <td>${p.amount}</td>
              <td><span className="chip-brand">{p.status}</span></td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={6} className="text-ink-500 text-sm">No payments yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
