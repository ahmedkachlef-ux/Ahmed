import Link from "next/link";
import { notFound } from "next/navigation";
import { Stars } from "@/components/Stars";
import { TrainingCard } from "@/components/TrainingCard";
import { SAMPLE_TRAININGS } from "@/lib/sampleData";
import { EnrollButton } from "@/components/EnrollButton";

const COVERS: Record<string, string> = {
  Cloud: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop",
  Cybersecurity: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1600&auto=format&fit=crop",
  AI: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600&auto=format&fit=crop",
  Data: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&auto=format&fit=crop",
  Telecom: "https://images.unsplash.com/photo-1581090700227-1e8e7c2f1f95?w=1600&auto=format&fit=crop",
  IT: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop",
  "Project Management": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&auto=format&fit=crop",
  Productivity: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&auto=format&fit=crop"
};

export default function TrainingDetailPage({ params }: { params: { slug: string } }) {
  const t = SAMPLE_TRAININGS.find(s => s.slug === params.slug);
  if (!t) return notFound();
  const related = SAMPLE_TRAININGS.filter(s => s.category === t.category && s.slug !== t.slug).slice(0, 3);
  const cover = t.cover || COVERS[t.category];

  return (
    <article className="container-page py-10">
      <Link href="/catalogue" className="text-sm text-ink-500 hover:text-brand-600">← Back to catalogue</Link>

      <div className="grid lg:grid-cols-12 gap-8 mt-4">
        <div className="lg:col-span-8">
          <div className="card overflow-hidden">
            <div className="aspect-[16/8] w-full">
              <img src={cover} alt={t.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="chip-brand">{t.category}</span>
                <span className="chip-muted capitalize">{t.format}</span>
                <span className="chip-muted capitalize">{t.level}</span>
                <Stars value={t.rating ?? 4.6} />
              </div>
              <h1 className="font-display font-extrabold text-3xl">{t.title}</h1>
              <p className="text-ink-600 dark:text-ink-300 mt-3">{t.description}</p>

              <div className="grid sm:grid-cols-3 gap-3 mt-6">
                <Stat label="Duration" value={`${t.durationHours} hours`} />
                <Stat label="Trainer" value={t.trainer || "ADVANCIA Faculty"} />
                <Stat label="Format" value={t.format[0].toUpperCase() + t.format.slice(1)} />
              </div>

              <h2 className="font-display font-bold text-xl mt-8">Learning outcomes</h2>
              <ul className="grid sm:grid-cols-2 gap-2 mt-3">
                {t.outcomes.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-brand-500">✓</span> {o}
                  </li>
                ))}
              </ul>

              <h2 className="font-display font-bold text-xl mt-8">Modules</h2>
              <div className="mt-3 space-y-2">
                {t.modules.map((m, i) => (
                  <div key={i} className="rounded-xl border border-ink-100 dark:border-ink-800 p-4">
                    <div className="font-semibold">{m.title}</div>
                    <div className="text-sm text-ink-500 mt-1">{m.items.join(" • ")}</div>
                  </div>
                ))}
              </div>

              <h2 className="font-display font-bold text-xl mt-8">About the trainer</h2>
              <p className="text-sm text-ink-500 mt-2">{t.trainerBio}</p>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-4">
          <div className="card p-6 sticky top-20">
            <div className="text-3xl font-display font-extrabold gradient-text">${t.price}</div>
            <div className="text-xs text-ink-500">per learner • includes labs & certificate</div>
            <EnrollButton slug={t.slug} />
            <div className="mt-4 text-sm">
              <div className="label mb-2">Upcoming sessions</div>
              <ul className="space-y-2">
                {t.sessions.map(s => (
                  <li key={s.code} className="rounded-xl border border-ink-100 dark:border-ink-800 p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm">{new Date(s.startDate).toLocaleDateString()} → {new Date(s.endDate).toLocaleDateString()}</div>
                      <span className="chip-brand">{s.state}</span>
                    </div>
                    <div className="text-xs text-ink-500 mt-1">{s.location} • {s.code}</div>
                    <div className="text-xs text-ink-500">{s.enrolled}/{s.seats} seats</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display font-bold text-2xl mb-4">Related trainings</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map(r => <TrainingCard key={r.slug} t={r} />)}
          </div>
        </section>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 dark:border-ink-800 p-3">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
