"use client";
import { cn } from "@/lib/cn";

export const FUNNY_AVATARS = [
  { id: "fox", emoji: "🦊", name: "Fox" },
  { id: "panda", emoji: "🐼", name: "Panda" },
  { id: "tiger", emoji: "🐯", name: "Tiger" },
  { id: "owl", emoji: "🦉", name: "Owl" },
  { id: "lion", emoji: "🦁", name: "Lion" },
  { id: "robot", emoji: "🤖", name: "Robot" },
  { id: "alien", emoji: "👽", name: "Alien" },
  { id: "ninja", emoji: "🥷", name: "Ninja" },
  { id: "wizard", emoji: "🧙", name: "Wizard" },
  { id: "astronaut", emoji: "🧑‍🚀", name: "Astronaut" },
  { id: "unicorn", emoji: "🦄", name: "Unicorn" },
  { id: "dragon", emoji: "🐲", name: "Dragon" }
];

export function emojiFor(id?: string) {
  return FUNNY_AVATARS.find(a => a.id === id)?.emoji || "🦊";
}

export function AvatarBubble({ id, size = 40, className }: { id?: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow", className)}
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      {emojiFor(id)}
    </span>
  );
}

export function AvatarPicker({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {FUNNY_AVATARS.map(a => (
        <button
          type="button"
          key={a.id}
          onClick={() => onChange(a.id)}
          className={cn(
            "aspect-square rounded-xl border text-2xl flex items-center justify-center transition-all",
            value === a.id
              ? "border-brand-500 ring-brand bg-brand-50 dark:bg-brand-500/15"
              : "border-ink-200 dark:border-ink-700 hover:border-brand-400"
          )}
          aria-label={a.name}
        >
          {a.emoji}
        </button>
      ))}
    </div>
  );
}
