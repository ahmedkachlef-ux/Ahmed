import Link from "next/link";
import { Layers } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-30 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-ink-50 hover:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white">
            <Layers className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">CanvasAI</span>
          <span className="ml-1 hidden text-[10px] uppercase tracking-widest text-ink-500 sm:inline">
            BMC Generator
          </span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/analyze" className="text-ink-300 hover:text-ink-100">Nouvelle analyse</Link>
          <Link href="/history" className="text-ink-300 hover:text-ink-100">Historique</Link>
          <Link href="/compare" className="text-ink-300 hover:text-ink-100">Comparer</Link>
          <Link href="/admin" className="text-ink-300 hover:text-ink-100">Admin</Link>
        </div>
      </div>
    </nav>
  );
}
