"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function SearchBar({
  onSubmit,
  loading
}: {
  onSubmit: (data: {
    company: string;
    country?: string;
    sector?: string;
    website?: string;
    language?: "fr" | "en" | "ar";
  }) => void;
  loading?: boolean;
}) {
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [sector, setSector] = useState("");
  const [website, setWebsite] = useState("");
  const [language, setLanguage] = useState<"fr" | "en" | "ar">("fr");
  const [advanced, setAdvanced] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;
    onSubmit({
      company: company.trim(),
      country: country.trim() || undefined,
      sector: sector.trim() || undefined,
      website: website.trim() || undefined,
      language
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Nom d'une entreprise (ex: Doctolib, Airbnb, Spotify...)"
            className="pl-9 h-12 text-base"
            autoFocus
          />
        </div>
        <Button type="submit" size="lg" loading={loading} disabled={!company.trim()}>
          Analyser
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-400">
        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="hover:text-ink-200"
        >
          {advanced ? "− Masquer les filtres" : "+ Filtres avancés"}
        </button>
        <span className="text-ink-500">
          Aucune information n'est inventée. Sources hiérarchisées.
        </span>
      </div>

      {advanced && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Pays" />
          <Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Secteur" />
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Site officiel (URL)" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="h-10 rounded-xl border border-ink-700 bg-ink-900/70 px-3 text-sm text-ink-100"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      )}
    </form>
  );
}
