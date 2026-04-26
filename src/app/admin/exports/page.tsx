"use client";
import { useState } from "react";

export default function ExportsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");

  function url(prefix: string) {
    const p = new URLSearchParams({ q, status, role, gender });
    return `${prefix}?${p.toString()}`;
  }

  return (
    <>
      <div>
        <h1 className="font-display font-extrabold text-2xl">Reports & exports</h1>
        <p className="text-sm text-ink-500">Generate professional Excel and PDF reports of users with rich, structured columns.</p>
      </div>
      <div className="card p-5 grid sm:grid-cols-4 gap-3">
        <input className="input sm:col-span-2" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
          {["", "active", "pending", "suspended"].map(s => <option key={s} value={s}>{s ? `Status: ${s}` : "All statuses"}</option>)}
        </select>
        <select className="input" value={role} onChange={e => setRole(e.target.value)}>
          {["", "user", "admin", "super_admin"].map(s => <option key={s} value={s}>{s ? `Role: ${s}` : "All roles"}</option>)}
        </select>
        <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
          {["", "female", "male", "other", "unspecified"].map(s => <option key={s} value={s}>{s ? `Gender: ${s}` : "All genders"}</option>)}
        </select>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <a href={url("/api/export/users")} className="card p-6 hover:shadow-glow">
          <div className="font-display font-bold">Excel report</div>
          <p className="text-sm text-ink-500 mt-1">XLSX with structured columns including IDs, training and authentication metadata.</p>
          <div className="btn btn-primary mt-3 inline-flex">Download .xlsx</div>
        </a>
        <a href={url("/api/export/users/pdf")} className="card p-6 hover:shadow-glow">
          <div className="font-display font-bold">PDF report</div>
          <p className="text-sm text-ink-500 mt-1">Branded printable table with all key user fields.</p>
          <div className="btn btn-primary mt-3 inline-flex">Download .pdf</div>
        </a>
      </div>
    </>
  );
}
