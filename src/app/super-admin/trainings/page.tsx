"use client";
import { useEffect, useState } from "react";
import { CATEGORIES, FORMATS, LEVELS } from "@/lib/sampleData";

const empty = { code: "", title: "", slug: "", category: "Cloud", level: "intermediate", format: "online", durationHours: 16, price: 0, trainer: "", summary: "", state: "published" };

export default function TrainingsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [state, setState] = useState("");
  const [editing, setEditing] = useState<any | null>(null);

  function load() {
    const p = new URLSearchParams({ q, category: cat, state });
    fetch(`/api/admin/trainings?${p}`).then(r => r.json()).then(j => setItems(j.items || []));
  }
  useEffect(load, [q, cat, state]);

  async function save() {
    if (!editing) return;
    const method = editing._id ? "PATCH" : "POST";
    const r = await fetch("/api/admin/trainings", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    if (r.ok) { setEditing(null); load(); }
  }
  async function del(id: string) {
    if (!confirm("Delete training?")) return;
    await fetch(`/api/admin/trainings?id=${id}`, { method: "DELETE" });
    load();
  }

  return (<>
    <div className="flex items-center justify-between">
      <h1 className="font-display font-extrabold text-2xl">Trainings</h1>
      <button className="btn btn-primary" onClick={() => setEditing({ ...empty })}>New training</button>
    </div>
    <div className="card p-4 flex flex-wrap gap-2">
      <input className="input md:w-72" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
      <select className="input md:w-44" value={cat} onChange={e => setCat(e.target.value)}><option value="">All categories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
      <select className="input md:w-44" value={state} onChange={e => setState(e.target.value)}>{["", "draft", "published", "archived"].map(s => <option key={s} value={s}>{s ? `State: ${s}` : "All states"}</option>)}</select>
    </div>
    <div className="card overflow-x-auto"><table className="table min-w-[1000px]">
      <thead><tr><th>Title</th><th>Code</th><th>Category</th><th>Level</th><th>Format</th><th>Duration</th><th>State</th><th></th></tr></thead>
      <tbody>{items.map((t: any) => (
        <tr key={t._id}>
          <td>{t.title}</td><td className="font-mono text-xs">{t.code}</td><td>{t.category}</td>
          <td className="capitalize">{t.level}</td><td className="capitalize">{t.format}</td>
          <td>{t.durationHours}h</td><td><span className="chip-brand">{t.state}</span></td>
          <td><div className="flex gap-1">
            <button onClick={() => setEditing(t)} className="btn btn-outline !py-1 text-xs">Edit</button>
            <button onClick={() => del(t._id)} className="btn !py-1 text-xs text-red-600">Delete</button>
          </div></td>
        </tr>))}
        {items.length === 0 && <tr><td colSpan={8} className="text-sm text-ink-500">No trainings yet.</td></tr>}
      </tbody>
    </table></div>

    {editing && (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
        <div className="card p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
          <h3 className="font-display font-extrabold text-xl">{editing._id ? "Edit training" : "New training"}</h3>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <Input label="Title" v={editing.title} on={v => setEditing({ ...editing, title: v })} />
            <Input label="Code" v={editing.code} on={v => setEditing({ ...editing, code: v })} />
            <Input label="Slug" v={editing.slug} on={v => setEditing({ ...editing, slug: v })} />
            <Input label="Trainer" v={editing.trainer} on={v => setEditing({ ...editing, trainer: v })} />
            <Sel label="Category" v={editing.category} on={v => setEditing({ ...editing, category: v })} opts={CATEGORIES} />
            <Sel label="Level" v={editing.level} on={v => setEditing({ ...editing, level: v })} opts={LEVELS as any} />
            <Sel label="Format" v={editing.format} on={v => setEditing({ ...editing, format: v })} opts={FORMATS as any} />
            <Sel label="State" v={editing.state} on={v => setEditing({ ...editing, state: v })} opts={["draft","published","archived"]} />
            <Input label="Duration (hours)" type="number" v={editing.durationHours} on={v => setEditing({ ...editing, durationHours: Number(v) })} />
            <Input label="Price (USD)" type="number" v={editing.price} on={v => setEditing({ ...editing, price: Number(v) })} />
            <label className="block sm:col-span-2"><span className="label">Summary</span>
              <textarea className="input mt-1" rows={3} value={editing.summary || ""} onChange={e => setEditing({ ...editing, summary: e.target.value })} />
            </label>
          </div>
          <div className="mt-5 flex gap-2 justify-end">
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        </div>
      </div>
    )}
  </>);
}

function Input({ label, v, on, type = "text" }: any) {
  return (<label className="block"><span className="label">{label}</span>
    <input className="input mt-1" type={type} value={v ?? ""} onChange={e => on(e.target.value)} /></label>);
}
function Sel({ label, v, on, opts }: any) {
  return (<label className="block"><span className="label">{label}</span>
    <select className="input mt-1" value={v} onChange={e => on(e.target.value)}>{opts.map((o: string) => <option key={o} value={o}>{o}</option>)}</select></label>);
}
