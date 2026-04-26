"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarPicker } from "@/components/Avatar";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "", email: "", age: "", gender: "unspecified",
    company: "", department: "", password: "", avatar: "fox"
  });
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm(s => ({ ...s, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr("");
    const r = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, age: form.age ? Number(form.age) : undefined })
    });
    setLoading(false);
    if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j.error || "Registration failed."); return; }
    router.push("/dashboard?welcome=1");
  }

  return (
    <section className="container-page py-14 grid lg:grid-cols-2 gap-10 items-start">
      <div className="card p-8">
        <h1 className="font-display font-extrabold text-2xl">Create your ADVANCIA account</h1>
        <p className="text-sm text-ink-500 mt-1">Pick a funny avatar and tell us about you.</p>

        <div className="mt-6">
          <span className="label">Choose your avatar</span>
          <div className="mt-2"><AvatarPicker value={form.avatar} onChange={v => set("avatar", v)} /></div>
        </div>

        <form onSubmit={submit} className="mt-6 grid sm:grid-cols-2 gap-3">
          <Field label="Full name" value={form.fullName} onChange={v => set("fullName", v)} required />
          <Field label="Email" value={form.email} onChange={v => set("email", v)} type="email" required />
          <Field label="Age" value={form.age} onChange={v => set("age", v)} type="number" />
          <label className="block">
            <span className="label">Gender</span>
            <select className="input mt-1" value={form.gender} onChange={e => set("gender", e.target.value)}>
              <option value="unspecified">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
          <Field label="Company" value={form.company} onChange={v => set("company", v)} />
          <Field label="Department" value={form.department} onChange={v => set("department", v)} />
          <Field label="Password" value={form.password} onChange={v => set("password", v)} type="password" required full />
          {err && <div className="sm:col-span-2 text-sm text-red-600">{err}</div>}
          <div className="sm:col-span-2 flex items-center justify-between">
            <p className="text-xs text-ink-500">By continuing you agree to our terms.</p>
            <button disabled={loading} className="btn btn-primary">{loading ? "Creating…" : "Create account"}</button>
          </div>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
          <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" /> Or sign up with <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <a href="/api/auth/oauth/google" className="btn btn-outline">Google</a>
          <a href="/api/auth/oauth/facebook" className="btn btn-outline">Facebook</a>
          <a href="/api/auth/oauth/yahoo" className="btn btn-outline">Yahoo</a>
        </div>

        <p className="mt-6 text-sm text-ink-500">Already have an account? <Link href="/login" className="text-brand-600 font-semibold">Sign in</Link></p>
      </div>

      <div className="card p-8 bg-brand-gradient text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white/15 blur-3xl" />
        <h2 className="font-display font-extrabold text-3xl">Why ADVANCIA?</h2>
        <ul className="mt-4 space-y-2 text-sm opacity-95">
          <li>✓ Premium curriculum across IT, Cloud, AI, Cyber, PM, Data and Telecom</li>
          <li>✓ Personal recommendations from our AI assistant Alexa</li>
          <li>✓ Live trainers, hands-on labs and certification readiness</li>
          <li>✓ Beautiful dashboards in light & dark, English / French / Arabic</li>
        </ul>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, type = "text", required, full }: any) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="label">{label}{required && " *"}</span>
      <input className="input mt-1" type={type} value={value} required={!!required}
        onChange={e => onChange(e.target.value)} />
    </label>
  );
}
