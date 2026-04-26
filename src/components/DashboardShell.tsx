"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string; icon?: React.ReactNode };

export function DashboardShell({ items, children, title, subtitle }: { items: NavItem[]; children: React.ReactNode; title: string; subtitle?: string }) {
  const path = usePathname();
  return (
    <div className="container-page py-8 grid lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-3">
        <div className="card p-3 sticky top-20">
          <div className="px-3 py-2">
            <div className="font-display font-bold">{title}</div>
            {subtitle && <div className="text-xs text-ink-500">{subtitle}</div>}
          </div>
          <nav className="space-y-1 mt-2">
            {items.map(it => {
              const active = path === it.href || (it.href !== "/" && path.startsWith(it.href));
              return (
                <Link key={it.href} href={it.href}
                  className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium",
                    active ? "bg-brand-gradient text-white shadow-glow" : "hover:bg-brand-50 dark:hover:bg-ink-800")}>
                  <span className={cn("h-2 w-2 rounded-full", active ? "bg-white" : "bg-brand-400/60")} />
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <section className="lg:col-span-9 space-y-6">{children}</section>
    </div>
  );
}
