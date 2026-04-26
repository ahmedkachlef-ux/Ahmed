"use client";
import { useEffect, useState } from "react";

export function UsersTable({ allowSuper = false }: { allowSuper?: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [role, setRole] = useState(""); const [gender, setGender] = useState("");
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<any | null>(null);

  function load() {
    const p = new URLSearchParams({ q, status, role, gender, page: String(page), limit: "20" });
    fetch(`/api/users?${p.toString()}`).then(r => r.json()).then(j => { setItems(j.items || []); setTotal(j.total || 0); });
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, status, role, gender, page]);

  async function save() {
    if (!editing) return;
    await fetch(`/api/users/${editing._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    setEditing(null); load();
  }
  async function del(id: string) {
    if (!confirm("Delete user?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    load();
  }
  async function toggleActive(u: any) {
    await fetch(`/api/users/${u._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !u.active }) });
    load();
  }

  function exportXLSX() {
    const p = new URLSearchParams({ q, status, role, gender });
    window.location.href = `/api/export/users?${p.toString()}`;
  }
  function exportPDF() {
    const p = new URLSearchParams({ q, status, role, gender });
    window.location.href = `/api/export/users/pdf?${p.toString()}`;
  }

  return (
    <div className="space-y-3">
      <div className="card p-4 flex flex-wrap gap-2 items-end">
        <input className="input md:w-64" placeholder="Search name, email, company…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
        <select className="input md:w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          {["", "active", "pending", "suspended"].map(s => <option key={s} value={s}>{s ? `Status: ${s}` : "All statuses"}</option>)}
        </select>
        <select className="input md:w-40" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
          {["", "user", "admin", ...(allowSuper ? ["super_admin"] : [])].map(s => <option key={s} value={s}>{s ? `Role: ${s}` : "All roles"}</option>)}
        </select>
        <select className="input md:w-40" value={gender} onChange={e => { setGender(e.target.value); setPage(1); }}>
          {["", "female", "male", "other", "unspecified"].map(s => <option key={s} value={s}>{s ? `Gender: ${s}` : "All genders"}</option>)}
        </select>
        <div className="ms-auto flex gap-2">
          <button onClick={exportXLSX} className="btn btn-outline">Export Excel</button>
          <button onClick={exportPDF} className="btn btn-outline">Export PDF</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table min-w-[1100px]">
          <thead>
            <tr>
              <th>User</th><th>Role</th><th>Status</th><th>Company</th><th>Department</th>
              <th>Training</th><th>Progress</th><th>Email verified</th><th>Last login</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(u => (
              <tr key={u._id}>
                <td>
                  <div className="font-semibold">{u.fullName}</div>
                  <div className="text-xs text-ink-500">{u.email}</div>
                </td>
                <td><span className="chip-muted capitalize">{u.role.replace("_", " ")}</span></td>
                <td>
                  <span className={`chip ${u.status === "active" && u.active ? "bg-emerald-100 text-emerald-700" : u.status === "suspended" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{u.status}{u.active === false ? " · off" : ""}</span>
                </td>
                <td>{u.company || "—"}</td>
                <td>{u.department || "—"}</td>
                <td>
                  {u.currentTraining ? (<><div className="text-sm">{u.currentTraining}</div><div className="text-xs text-ink-500">{u.trainingCode || ""}</div></>) : <span className="text-xs text-ink-500">—</span>}
                </td>
                <td>{u.progressPercent != null ? `${u.progressPercent}%` : "—"}</td>
                <td>{u.emailVerified ? "Yes" : "No"}</td>
                <td className="text-xs">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "—"}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditing(u)} className="btn btn-outline !py-1 !px-2 text-xs">Edit</button>
                    <button onClick={() => toggleActive(u)} className="btn btn-ghost !py-1 !px-2 text-xs">{u.active ? "Deactivate" : "Activate"}</button>
                    <button onClick={() => del(u._id)} className="btn !py-1 !px-2 text-xs text-red-600 hover:bg-red-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={10} className="text-sm text-ink-500">No users.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-500">{total} total</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="btn btn-outline !py-1.5">Prev</button>
          <span className="self-center">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} className="btn btn-outline !py-1.5">Next</button>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="card p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-extrabold text-xl">Edit user</h3>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              {["fullName", "email", "phone", "age", "gender", "company", "department", "address"].map(k => (
                <label key={k} className="block">
                  <span className="label capitalize">{k}</span>
                  <input className="input mt-1" value={editing[k] ?? ""} onChange={e => setEditing({ ...editing, [k]: e.target.value })} />
                </label>
              ))}
              <label className="block">
                <span className="label">Role</span>
                <select className="input mt-1" value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })}>
                  {["user", "admin", ...(allowSuper ? ["super_admin"] : [])].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">Status</span>
                <select className="input mt-1" value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}>
                  {["active", "pending", "suspended"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
