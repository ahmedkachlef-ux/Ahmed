"use client";
import { useApp } from "@/app/providers";

export function LangSwitch() {
  const { lang, setLang } = useApp();
  return (
    <div className="inline-flex rounded-xl border border-ink-200 dark:border-ink-700 overflow-hidden text-xs">
      {(["en", "fr", "ar"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1.5 font-semibold uppercase ${
            lang === l ? "bg-brand-gradient text-white" : "hover:bg-brand-50 dark:hover:bg-ink-800"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
