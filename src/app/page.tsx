import Link from "next/link";
import { TrainingCard } from "@/components/TrainingCard";
import { AvatarPopGame } from "@/components/AvatarPopGame";
import { SAMPLE_TRAININGS, CATEGORIES } from "@/lib/sampleData";
import { Stars } from "@/components/Stars";
import { HeroCTA } from "@/components/HeroCTA";

export default function HomePage() {
  const featured = SAMPLE_TRAININGS.slice(0, 6);
  const upcoming = SAMPLE_TRAININGS
    .flatMap(t => t.sessions.map(s => ({ training: t, session: s })))
    .sort((a, b) => +new Date(a.session.startDate) - +new Date(b.session.startDate))
    .slice(0, 6);

  return (
    <>
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 hero-grid -z-10" />
        <div className="container-page pt-16 pb-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <span className="chip-brand">⚡ New 2026 cohort • Limited seats</span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Premium training that turns <span className="gradient-text">ambition</span> into <span className="gradient-text">mastery</span>.
            </h1>
            <p className="mt-5 text-lg text-ink-600 dark:text-ink-300 max-w-2xl">
              Hands-on programs in IT, Cloud, Cybersecurity, Project Management, Data, AI and Business productivity — designed for professionals who lead.
            </p>
            <HeroCTA />
            <div className="mt-8 flex items-center gap-6 text-sm text-ink-500">
              <div className="flex items-center gap-2"><Stars value={4.9} /> from 2,300+ alumni</div>
              <span className="hidden sm:inline">•</span>
              <span>Trusted by teams across telecom, banking & tech</span>
            </div>
          </div>
          <div className="lg:col-span-5">
            <AvatarPopGame />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-page py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="label">Explore by category</div>
            <h2 className="font-display font-bold text-2xl mt-1">Find your track</h2>
          </div>
          <Link href="/catalogue" className="btn btn-outline">All trainings</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map(c => (
            <Link href={`/catalogue?category=${encodeURIComponent(c)}`} key={c}
              className="card p-5 hover:shadow-glow transition-all hover:-translate-y-0.5">
              <div className="h-10 w-10 rounded-xl bg-brand-gradient text-white inline-flex items-center justify-center font-bold">
                {c.split(" ").map(w => w[0]).slice(0, 2).join("")}
              </div>
              <div className="mt-3 font-display font-bold">{c}</div>
              <div className="text-xs text-ink-500 mt-1">Curated programs</div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-page py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="label">Featured trainings</div>
            <h2 className="font-display font-bold text-2xl mt-1">Programs the community loves</h2>
          </div>
          <Link href="/catalogue" className="btn btn-ghost">See all →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map(t => <TrainingCard key={t.slug} t={t} />)}
        </div>
      </section>

      {/* UPCOMING */}
      <section className="container-page py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="label">Upcoming sessions</div>
            <h2 className="font-display font-bold text-2xl mt-1">Calendar preview</h2>
          </div>
          <Link href="/calendar" className="btn btn-outline">Open calendar</Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map(({ training, session }) => (
            <Link href={`/trainings/${training.slug}`} key={session.code} className="card p-4 flex items-center gap-4 hover:shadow-glow">
              <div className="rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 px-3 py-2 text-center w-16 shrink-0">
                <div className="text-[10px] uppercase font-bold">{new Date(session.startDate).toLocaleString(undefined, { month: "short" })}</div>
                <div className="text-2xl font-extrabold leading-none">{new Date(session.startDate).getDate()}</div>
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold truncate">{training.title}</div>
                <div className="text-xs text-ink-500 mt-0.5">{session.location} • {training.format}</div>
                <div className="mt-1"><span className="chip-muted">{session.code}</span></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-page py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="label">Loved by learners and teams</div>
          <h2 className="font-display font-bold text-3xl mt-1">Real outcomes, in their words</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mt-8">
          {[
            { who: "Yasmine, SOC Lead", text: "Best blue-team training I've ever attended. Practical, sharp, and immediately useful.", stars: 5 },
            { who: "Mehdi, Cloud Architect", text: "Pushed my AWS skills 2 levels up. Trainer's energy is unmatched.", stars: 5 },
            { who: "Hiba, PMO Director", text: "Our team passed PMP at 90%. Worth every dirham.", stars: 4.5 }
          ].map((t, i) => (
            <div key={i} className="card p-6">
              <Stars value={t.stars} />
              <p className="mt-3 text-ink-700 dark:text-ink-200">“{t.text}”</p>
              <div className="mt-4 text-sm font-semibold text-ink-500">{t.who}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-16">
        <div className="card p-10 bg-brand-gradient text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white/15 blur-3xl" />
          <div className="relative grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="font-display text-3xl font-extrabold">Ready to upskill your team?</h3>
              <p className="opacity-90 mt-2 max-w-lg">Tailored cohorts, on-site bootcamps and corporate plans for ambitious organizations.</p>
            </div>
            <div className="flex md:justify-end gap-3">
              <Link href="/register" className="btn bg-white text-brand-700 hover:brightness-95">Create account</Link>
              <Link href="/catalogue" className="btn border border-white/40 hover:bg-white/10 text-white">Browse catalogue</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
