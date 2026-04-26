"use client";
import { useEffect, useMemo, useState } from "react";
import { TrainingCard, type TrainingLite } from "@/components/TrainingCard";
import { CATEGORIES, FORMATS, LEVELS } from "@/lib/sampleData";
import { useApp } from "@/app/providers";

export default function CataloguePage() {
  const { t } = useApp();
  const [items, setItems] = useState<TrainingLite[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [format, setFormat] = useState("");
  const [sort, setSort] = useState("popular");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ q, category, level, format, sort });
    fetch(`/api/trainings?${p.toString()}`)
      .then(r => r.json())
      .then(j => setItems(j.items || []))
      .finally(() => setLoading(false));
  }, [q, category, level, format, sort]);

  const total = items.length;

  return (
    <section className="container-page py-10">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="label">Catalogue</div>
          <h1 className="font-display font-extrabold text-3xl mt-1">All trainings</h1>
          <p className="text-ink-500 mt-1">{total} programs across {CATEGORIES.length} tracks</p>
        </div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={t("search")} className="input md:w-80" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Select label="Category" value={category} onChange={setCategory} options={["", ...CATEGORIES]} render={v => v || "All categories"} />
        <Select label="Level" value={level} onChange={setLevel} options={["", ...LEVELS]} render={v => v ? v[0].toUpperCase() + v.slice(1) : "All levels"} />
        <Select label="Format" value={format} onChange={setFormat} options={["", ...FORMATS]} render={v => v ? v[0].toUpperCase() + v.slice(1) : "All formats"} />
        <Select label="Sort" value={sort} onChange={setSort} options={["popular", "rating", "duration", "price"]} render={v => `Sort: ${v}`} />
      </div>

      {loading && <div className="text-sm text-ink-500">Loading…</div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map(t => <TrainingCard key={t.slug} t={t} />)}
      </div>
    </section>
  );
}

function Select({ label, value, onChange, options, render }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[] | string[]; render: (v: string) => string;
}) {
  return (
    <label className="block">
      <span className="label block mb-1">{label}</span>
      <select className="input" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{render(o)}</option>)}
      </select>
    </label>
  );
}
