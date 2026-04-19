import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function shortId() {
  return Math.random().toString(36).slice(2, 10);
}

export function formatDate(iso: string, locale = "fr-FR") {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function confidenceColor(score: number) {
  if (score >= 75) return "confidence.high";
  if (score >= 45) return "confidence.mid";
  return "confidence.low";
}

export function confidenceLabel(score: number) {
  if (score >= 75) return "Élevée";
  if (score >= 45) return "Moyenne";
  return "Faible";
}

export function statusLabel(status: "verified" | "estimated" | "incomplete") {
  return status === "verified"
    ? "Vérifié"
    : status === "estimated"
      ? "Estimé"
      : "Incomplet";
}
