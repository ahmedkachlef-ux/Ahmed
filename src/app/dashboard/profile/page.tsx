"use client";
import { useEffect, useState } from "react";
import { AvatarPicker } from "@/components/Avatar";

export default function ProfilePage() {
  const [u, setU] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [pwd, setPwd] = useState({ current: "", next: "" });

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => setU(j.user || {}));
  }, []);

  if (!u) return <div className="card p-6">Loading…</div>;

  function set<K extends string>(k: K, v: any) { setU((s: any) => ({ ...s, [k]: v })); }

  async function save() {
    setMsg("");
    const r = await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(u) });
    setMsg(r.ok ? "Saved" : "Save failed");
  }
  async function changePwd() {
    setMsg("");
    const r = await fetch("/api/users/me/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pwd) });
    setMsg(r.ok ? "Password updated" : "Could not update password");
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="font-display font-extrabold text-2xl">Profile</h1>
        <p className="text-sm text-ink-500">Manage your personal details.</p>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <Field label="Full name" value={u.fullName || ""} onChange={v => set("fullName", v)} />
          <Field label="Email" value={u.email || ""} disabled />
          <Field label="Phone" value={u.phone || ""} onChange={v => set("phone", v)} />
          <Field label="Age" type="number" value={u.age || ""} onChange={v => set("age", Number(v))} />
          <Field label="Gender" select value={u.gender || "unspecified"} onChange={v => set("gender", v)}
            options={["unspecified", "female", "male", "other"]} />
          <Field label="Company" value={u.company || ""} onChange={v => set("company", v)} />
          <Field label="Department" value={u.department || ""} onChange={v => set("department", v)} />
          <Field label="Address" value={u.address || ""} onChange={v => set("address", v)} />
          <Field label="Language" select value={u.language || "en"} onChange={v => set("language", v)} options={["en", "fr", "ar"]} />
          <Field label="Theme" select value={u.theme || "light"} onChange={v => set("theme", v)} options={["light", "dark"]} />
          <Field label="Focus tracks (comma-separated)" value={(u.focusTracks || []).join(", ")} onChange={v => set("focusTracks", v.split(",").map((s: string) => s.trim()).filter(Boolean))} />
          <Field label="Interests (comma-separated)" value={(u.interests || []).join(", ")} onChange={v => set("interests", v.split(",").map((s: string) => s.trim()).filter(Boolean))} />
        </div>

        <div className="mt-6">
          <span className="label">Avatar</span>
          <div className="mt-2 max-w-sm"><AvatarPicker value={u.avatar} onChange={v => set("avatar", v)} /></div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button className="btn btn-primary" onClick={save}>Save changes</button>
          {msg && <span className="text-sm text-brand-600">{msg}</span>}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display font-bold">Change password</h2>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <Field label="Current password" type="password" value={pwd.current} onChange={v => setPwd(p => ({ ...p, current: v }))} />
          <Field label="New password" type="password" value={pwd.next} onChange={v => setPwd(p => ({ ...p, next: v }))} />
        </div>
        <button className="btn btn-outline mt-3" onClick={changePwd}>Update password</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type, disabled, select, options }: any) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {select ? (
        <select className="input mt-1" value={value} onChange={e => onChange?.(e.target.value)} disabled={disabled}>
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input className="input mt-1" type={type || "text"} value={value} disabled={disabled}
          onChange={e => onChange?.(e.target.value)} />
      )}
    </label>
  );
}
