"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SAMPLE_TRAININGS, CATEGORIES } from "@/lib/sampleData";

export default function CalendarPage() {
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [q, setQ] = useState("");

  const sessions = useMemo(() => {
    const base = SAMPLE_TRAININGS.flatMap(t => t.sessions.map(s => ({ training: t, session: s })));
    return base
      .filter(({ training, session }) => {
        if (category && training.category !== category) return false;
        if (state && session.state !== state) return false;
        if (q && !`${training.title} ${session.code} ${session.location}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => +new Date(a.session.startDate) - +new Date(b.session.startDate));
  }, [category, state, q]);

  const months = useMemo(() => {
    const map = new Map<string, typeof sessions>();
    sessions.forEach(s => {
      const k = new Date(s.session.startDate).toLocaleString(undefined, { month: "long", year: "numeric" });
      const arr = map.get(k) || [];
      arr.push(s);
      map.set(k, arr);
    });
    return [...map.entries()];
  }, [sessions]);

  return (
    <section className="container-page py-10">
      <div className="flex items-end justify-between gap-3 mb-6 flex-wrap">
        <div>
          <div className="label">Calendar</div>
          <h1 className="font-display font-extrabold text-3xl mt-1">All upcoming sessions</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="input md:w-64" placeholder="Search code, title, city…" value={q} onChange={e => setQ(e.target.value)} />
          <select className="input md:w-48" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input md:w-44" value={state} onChange={e => setState(e.target.value)}>
            {["", "scheduled", "open", "running", "closed", "completed", "cancelled"].map(s =>
              <option key={s} value={s}>{s ? `Status: ${s}` : "All statuses"}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {months.map(([month, list]) => (
          <div key={month}>
            <div className="font-display font-bold text-xl mb-3">{month}</div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map(({ training, session }) => (
                <Link href={`/trainings/${training.slug}`} key={session.code} className="card p-4 hover:shadow-glow flex gap-4">
                  <div className="rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 px-3 py-2 text-center w-16 shrink-0">
                    <div className="text-[10px] uppercase font-bold">{new Date(session.startDate).toLocaleString(undefined, { month: "short" })}</div>
                    <div className="text-2xl font-extrabold leading-none">{new Date(session.startDate).getDate()}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{training.title}</div>
                    <div className="text-xs text-ink-500 mt-1">{session.location} • {training.format}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="chip-muted">{session.code}</span>
                      <span className="chip-brand">{session.state}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
