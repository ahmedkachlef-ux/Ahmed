"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Stars } from "./Stars";

export type TrainingLite = {
  _id?: string;
  slug: string;
  title: string;
  category: string;
  level: string;
  format: string;
  durationHours: number;
  price?: number;
  rating?: number;
  cover?: string;
  trainer?: string;
  summary?: string;
};

const COVERS: Record<string, string> = {
  Cloud: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&auto=format&fit=crop",
  Cybersecurity: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=900&auto=format&fit=crop",
  AI: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=900&auto=format&fit=crop",
  Data: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&auto=format&fit=crop",
  Telecom: "https://images.unsplash.com/photo-1581090700227-1e8e7c2f1f95?w=900&auto=format&fit=crop",
  IT: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop",
  "Project Management": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&auto=format&fit=crop",
  Productivity: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&auto=format&fit=crop"
};

export function TrainingCard({ t }: { t: TrainingLite }) {
  const cover = t.cover || COVERS[t.category] || COVERS.IT;
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="card overflow-hidden group flex flex-col"
    >
      <Link href={`/trainings/${t.slug}`} className="relative block">
        <div className="aspect-[16/9] w-full overflow-hidden">
          <img src={cover} alt={t.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent">
          <span className="chip-brand backdrop-blur bg-white/80 text-brand-700">{t.category}</span>
          <span className="chip bg-white/80 text-ink-800 text-xs font-semibold capitalize">{t.format}</span>
        </div>
      </Link>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Stars value={t.rating ?? 4.6} />
          <span className="text-xs text-ink-500">{t.durationHours}h · {t.level}</span>
        </div>
        <Link href={`/trainings/${t.slug}`} className="font-display font-bold text-lg leading-snug hover:text-brand-600 transition-colors">
          {t.title}
        </Link>
        {t.summary && <p className="text-sm text-ink-500 dark:text-ink-400 line-clamp-2">{t.summary}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xs text-ink-500">by {t.trainer || "ADVANCIA Faculty"}</span>
          <Link href={`/trainings/${t.slug}`} className="btn btn-primary !py-1.5 !px-3 text-xs">View</Link>
        </div>
      </div>
    </motion.div>
  );
}
