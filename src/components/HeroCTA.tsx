"use client";
import Link from "next/link";
import { useApp } from "@/app/providers";

export function HeroCTA() {
  const { t } = useApp();
  return (
    <div className="mt-7 flex flex-wrap items-center gap-3">
      <Link href="/catalogue" className="btn btn-primary">{t("cta_browse")} →</Link>
      <Link href="/register" className="btn btn-outline">{t("cta_join")}</Link>
    </div>
  );
}
