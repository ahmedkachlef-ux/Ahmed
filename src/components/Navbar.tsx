"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { LangSwitch } from "./LangSwitch";
import { Logo } from "./Logo";
import { useApp } from "@/app/providers";

type Me = { id: string; email: string; role: "user" | "admin" | "super_admin"; fullName?: string; avatar?: string } | null;

export function Navbar() {
  const { t } = useApp();
  const [me, setMe] = useState<Me>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => {
      if (j.user) setMe({ id: j.user._id, email: j.user.email, role: j.user.role, fullName: j.user.fullName, avatar: j.user.avatar });
    });
  }, []);

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-[rgb(var(--bg))]/80 border-b border-ink-100 dark:border-ink-800">
      <div className="container-page flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <Logo />
        </div>
        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
          <Link href="/" className="px-3 py-2 rounded-lg hover:text-brand-600">{t("home")}</Link>
          <Link href="/catalogue" className="px-3 py-2 rounded-lg hover:text-brand-600">{t("catalogue")}</Link>
          <Link href="/calendar" className="px-3 py-2 rounded-lg hover:text-brand-600">{t("calendar")}</Link>
          {me?.role === "user" && <Link href="/dashboard" className="px-3 py-2 rounded-lg hover:text-brand-600">{t("dashboard")}</Link>}
          {me?.role === "admin" && <Link href="/admin" className="px-3 py-2 rounded-lg hover:text-brand-600">{t("admin")}</Link>}
          {me?.role === "super_admin" && <Link href="/super-admin" className="px-3 py-2 rounded-lg hover:text-brand-600">{t("super_admin")}</Link>}
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitch />
          <ThemeToggle />
          {!me ? (
            <>
              <Link href="/login" className="btn btn-ghost hidden sm:inline-flex">{t("login")}</Link>
              <Link href="/register" className="btn btn-primary">{t("register")}</Link>
            </>
          ) : (
            <div className="relative">
              <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 rounded-xl border border-ink-200 dark:border-ink-700 hover:border-brand-400 px-2 py-1">
                <span className="h-7 w-7 rounded-lg bg-brand-gradient text-white text-xs font-bold inline-flex items-center justify-center">
                  {(me.fullName?.[0] || me.email[0]).toUpperCase()}
                </span>
                <span className="hidden sm:block text-sm font-semibold max-w-[120px] truncate">{me.fullName || me.email}</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-56 card p-2 z-50">
                  <Link className="block px-3 py-2 rounded-lg hover:bg-brand-50 dark:hover:bg-ink-800 text-sm" href="/dashboard">My dashboard</Link>
                  <Link className="block px-3 py-2 rounded-lg hover:bg-brand-50 dark:hover:bg-ink-800 text-sm" href="/dashboard/profile">Profile</Link>
                  {me.role !== "user" && <Link className="block px-3 py-2 rounded-lg hover:bg-brand-50 dark:hover:bg-ink-800 text-sm" href="/admin">Admin</Link>}
                  {me.role === "super_admin" && <Link className="block px-3 py-2 rounded-lg hover:bg-brand-50 dark:hover:bg-ink-800 text-sm" href="/super-admin">Super Admin</Link>}
                  <button
                    onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/"; }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-brand-50 dark:hover:bg-ink-800 text-sm text-brand-600">
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
