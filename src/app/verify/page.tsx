"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const params = useSearchParams();
  const [state, setState] = useState<"working" | "ok" | "fail">("working");

  useEffect(() => {
    const token = params.get("token");
    const email = params.get("email");
    if (!token || !email) { setState("fail"); return; }
    fetch(`/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`)
      .then(r => setState(r.ok ? "ok" : "fail"));
  }, [params]);

  return (
    <section className="container-page py-20 text-center">
      <div className="card p-10 max-w-md mx-auto">
        {state === "working" && <p>Verifying your email…</p>}
        {state === "ok" && <p className="text-brand-600 font-semibold">Email verified! You can continue.</p>}
        {state === "fail" && <p className="text-red-600">Verification failed. Please request a new email.</p>}
      </div>
    </section>
  );
}
