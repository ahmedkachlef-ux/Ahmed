"use client";
import { useState } from "react";

export function EnrollButton({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "needs-login">("idle");
  async function onClick() {
    setState("sending");
    const r = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug })
    });
    if (r.status === 401) { setState("needs-login"); return; }
    if (r.ok) setState("ok");
    else setState("idle");
  }
  return (
    <div className="mt-4">
      <button onClick={onClick} className="btn btn-primary w-full" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : state === "ok" ? "Request sent ✓" : "Request enrollment"}
      </button>
      {state === "needs-login" && (
        <a href={`/login?next=/trainings/${slug}`} className="text-xs text-brand-600 mt-2 inline-block">Sign in to enroll →</a>
      )}
    </div>
  );
}
