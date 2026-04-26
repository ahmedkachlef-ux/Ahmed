"use client";
import { useEffect, useState } from "react";

export default function EnrollmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  function load() { fetch("/api/enrollments").then(r => r.json()).then(j => setItems(j.items || [])); }
  useEffect(load, []);

  async function decide(id: string, status: "accepted" | "rejected") {
    await fetch("/api/enrollments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    load();
  }

  const filtered = items.filter(i =>
    (!status || i.status === status) &&
    (!q || `${i.training?.title || ""} ${i.user?.email || ""} ${i.user?.fullName || ""}`.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display font-extrabold text-2xl">Enrollment requests</h1>
      </div>
      <div className="card p-4 flex gap-2 flex-wrap">
        <input className="input md:w-72" placeholder="Search learner or training…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="input md:w-44" value={status} onChange={e => setStatus(e.target.value)}>
          {["", "requested", "accepted", "rejected", "completed", "cancelled"].map(s => <option key={s} value={s}>{s ? `Status: ${s}` : "All statuses"}</option>)}
        </select>
      </div>
      <div className="card overflow-x-auto">
        <table className="table min-w-[800px]">
          <thead><tr><th>Learner</th><th>Training</th><th>Status</th><th>Progress</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {filtered.map((e: any) => (
              <tr key={e._id}>
                <td>
                  <div className="font-semibold">{e.user?.fullName || "—"}</div>
                  <div className="text-xs text-ink-500">{e.user?.email}</div>
                </td>
                <td>{e.training?.title || "—"}</td>
                <td><span className="chip-brand capitalize">{e.status}</span></td>
                <td>{e.progress || 0}%</td>
                <td className="text-xs">{new Date(e.createdAt).toLocaleString()}</td>
                <td>
                  {e.status === "requested" && (
                    <div className="flex gap-1">
                      <button onClick={() => decide(e._id, "accepted")} className="btn btn-primary !py-1 text-xs">Accept</button>
                      <button onClick={() => decide(e._id, "rejected")} className="btn btn-outline !py-1 text-xs">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="text-sm text-ink-500">No enrollments.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
