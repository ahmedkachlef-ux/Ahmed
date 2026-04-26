"use client";
import { useEffect, useState } from "react";

export default function AdminsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "admin" });
  function load() { fetch("/api/users?role=admin&limit=50").then(r => r.json()).then(j => setItems(j.items || [])); }
  useEffect(load, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) { setForm({ fullName: "", email: "", password: "", role: "admin" }); load(); }
  }
  async function setRole(u: any, role: string) {
    await fetch(`/api/users/${u._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    load();
  }
  async function setActive(u: any, active: boolean) {
    await fetch(`/api/users/${u._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
    load();
  }
  return (<>
    <h1 className="font-display font-extrabold text-2xl">Admins</h1>
    <form onSubmit={create} className="card p-4 grid sm:grid-cols-5 gap-2 items-end">
      <input className="input" placeholder="Full name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
      <input className="input" placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
      <input className="input" placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
      <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
        <option value="admin">admin</option><option value="super_admin">super_admin</option>
      </select>
      <button className="btn btn-primary">Create</button>
    </form>
    <div className="card overflow-x-auto">
      <table className="table"><thead><tr><th>Admin</th><th>Role</th><th>Active</th><th>Last login</th><th></th></tr></thead>
        <tbody>
          {items.map((u: any) => (
            <tr key={u._id}>
              <td><div className="font-semibold">{u.fullName}</div><div className="text-xs text-ink-500">{u.email}</div></td>
              <td>
                <select className="input !py-1" value={u.role} onChange={e => setRole(u, e.target.value)}>
                  <option value="user">user</option><option value="admin">admin</option><option value="super_admin">super_admin</option>
                </select>
              </td>
              <td>{u.active ? "Yes" : "No"}</td>
              <td className="text-xs">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "—"}</td>
              <td><button onClick={() => setActive(u, !u.active)} className="btn btn-outline !py-1 text-xs">{u.active ? "Deactivate" : "Activate"}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>);
}
