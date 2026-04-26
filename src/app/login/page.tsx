"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr("");
    const r = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    setLoading(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.error === "invalid_credentials" ? "Invalid email or password." : j.error || "Sign-in failed.");
      return;
    }
    const j = await r.json();
    const next = params.get("next") || (j.role === "admin" ? "/admin" : j.role === "super_admin" ? "/super-admin" : "/dashboard");
    router.push(next);
  }

  return (
    <section className="container-page py-14 grid lg:grid-cols-2 gap-10 items-center">
      <div className="hidden lg:block">
        <div className="card p-10 bg-brand-gradient text-white relative overflow-hidden">
          <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-white/15 blur-3xl" />
          <h2 className="font-display font-extrabold text-3xl">Welcome back to ADVANCIA.</h2>
          <p className="opacity-90 mt-2">Pick up where you left off — your dashboard, recommendations and Alexa assistant are ready.</p>
        </div>
      </div>
      <div className="card p-8 max-w-md w-full mx-auto">
        <h1 className="font-display font-extrabold text-2xl">Sign in</h1>
        <p className="text-sm text-ink-500">Use your ADVANCIA account.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block">
            <span className="label">Email</span>
            <input className="input mt-1" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input className="input mt-1" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button disabled={loading} className="btn btn-primary w-full">{loading ? "Signing in…" : "Sign in"}</button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
          <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" /> OR <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <a href="/api/auth/oauth/google" className="btn btn-outline">Google</a>
          <a href="/api/auth/oauth/facebook" className="btn btn-outline">Facebook</a>
          <a href="/api/auth/oauth/yahoo" className="btn btn-outline">Yahoo</a>
        </div>
        <p className="mt-6 text-sm text-ink-500">No account? <Link href="/register" className="text-brand-600 font-semibold">Create one</Link></p>
      </div>
    </section>
  );
}
