import type { Source } from "../types";

/**
 * Source reliability tiers (rank = lower is better).
 * 1. Site officiel de l'entreprise (pages corporate, investor relations)
 * 2. Rapports annuels / universels d'enregistrement
 * 3. Documents réglementaires (SEC, AMF, dépôts réglementés)
 * 4. Registres officiels (INSEE, Companies House, RCS, trade registries)
 * 5. Communiqués de presse officiels
 * 6. Presse économique spécialisée (FT, WSJ, Les Echos…)
 * 7. Bases professionnelles (Crunchbase, Pitchbook, LinkedIn, Statista…)
 */
export const SOURCE_TIERS: Record<
  Source["rank"],
  { label: string; weight: number }
> = {
  1: { label: "Site officiel", weight: 1.0 },
  2: { label: "Rapport annuel", weight: 0.95 },
  3: { label: "Document réglementaire", weight: 0.9 },
  4: { label: "Registre officiel", weight: 0.85 },
  5: { label: "Communiqué officiel", weight: 0.75 },
  6: { label: "Presse économique", weight: 0.6 },
  7: { label: "Base professionnelle", weight: 0.45 }
};

/** Aggregate trust score 0–100 for a list of sources. */
export function trustScore(sources: Source[]): number {
  if (!sources.length) return 0;
  const sum = sources.reduce((acc, s) => acc + (SOURCE_TIERS[s.rank]?.weight ?? 0.3), 0);
  return Math.round((sum / sources.length) * 100);
}

/** Sort by rank ascending (best first), then by date descending. */
export function rankSources(sources: Source[]): Source[] {
  return [...sources].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    const da = a.date ? Date.parse(a.date) : 0;
    const db = b.date ? Date.parse(b.date) : 0;
    return db - da;
  });
}

/** Infer a rank 1-7 from a raw category label returned by the model. */
export function inferRank(category: string): Source["rank"] {
  const c = category.toLowerCase();
  if (/(site officiel|official site|corporate)/.test(c)) return 1;
  if (/(annual|rapport annuel|urd|10-k|20-f)/.test(c)) return 2;
  if (/(sec|amf|esma|prospectus|regulatory)/.test(c)) return 3;
  if (/(register|insee|rcs|companies house|registre)/.test(c)) return 4;
  if (/(press release|communiqu)/.test(c)) return 5;
  if (/(ft|wsj|bloomberg|reuters|les echos|la tribune|financial times|press)/.test(c)) return 6;
  return 7;
}
