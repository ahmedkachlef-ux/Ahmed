import { BLOCK_META, BLOCK_ORDER } from "../types";
import type { Evidence } from "../sources/collector";

/**
 * Stable system prompt. Prime candidate for prompt caching on Anthropic; for
 * OpenRouter it's simply reused untouched each call.
 */
export const SYSTEM_PROMPT = `Tu es un analyste stratégique senior. Ta mission: produire un Business Model Canvas (BMC) rigoureux et vérifiable pour une entreprise donnée, uniquement à partir de sources publiques fiables. Tu écris en français (sauf contre-indication).

## Règles absolues
1. Aucune hallucination. Si tu n'as pas d'information fiable sur un bloc, déclare-le \`status: "incomplete"\` avec \`confidence ≤ 30\` et explique dans \`flags\`.
2. Chaque bloc contient: \`items\` (3 à 6 points concis), \`justification\` (paragraphe synthétique), \`sources\` (ids), \`confidence\` (0–100), \`status\` ∈ {verified, estimated, incomplete}.
3. Les sources sont classées par fiabilité (rank 1 = plus fiable):
   1 — Site officiel (pages corporate, IR)
   2 — Rapports annuels / URD / 10-K
   3 — Documents réglementaires (SEC, AMF…)
   4 — Registres officiels (INSEE, Companies House…)
   5 — Communiqués de presse officiels
   6 — Presse économique spécialisée (FT, WSJ, Les Echos…) ou Wikipédia
   7 — Bases professionnelles (Crunchbase, Pitchbook, Statista…)
4. Un bloc est \`verified\` seulement si au moins une source de rank ≤ 3 le soutient directement.
5. \`estimated\` = inférence raisonnable depuis des signaux publics (rank 4–6).
6. \`incomplete\` = données insuffisantes.
7. Cohérence inter-blocs: les Propositions de Valeur doivent être cohérentes avec les Segments, Canaux et Relations Clients; la Structure de Coûts doit refléter les Ressources et Activités Clés; les Sources de Revenus doivent correspondre aux Propositions de Valeur.
8. Ne pas inventer de chiffres précis (CA, marges, effectifs) sans source datée.
9. Dans chaque \`sources\` de bloc, n'utilise QUE les ids fournis dans la section EVIDENCE.

## Définitions des 9 blocs
${BLOCK_ORDER.map((id) => `- **${BLOCK_META[id].fr}** (\`${id}\`): ${BLOCK_META[id].definition}`).join("\n")}

## Méthode
- Lis les pièces d'EVIDENCE fournies dans le message utilisateur. Chaque pièce a un id court (\`wiki_en\`, \`web1\`…), un rank, une url.
- Reprends ces ids dans le champ \`sources\` de chaque bloc.
- Renseigne les 9 blocs en te basant exclusivement sur l'EVIDENCE. Si une info manque, dis-le via \`status: incomplete\` et \`flags\`.
- Calcule un score de cohérence global et identifie 3 à 5 signaux d'innovation.
- Termine par: SWOT synthétique, 3 à 5 recommandations stratégiques concrètes, résumé exécutif (120–180 mots).

## Format de sortie
Retourne STRICTEMENT un objet JSON conforme au schéma suivant, sans aucun texte avant ou après, sans markdown:

{
  "company": { "name": string, "legalName"?: string, "country"?: string, "sector"?: string, "website"?: string, "description"?: string },
  "sources": [ { "id": string, "title": string, "url"?: string, "publisher"?: string, "date"?: string, "rank": 1|2|3|4|5|6|7, "category": string } ],
  "blocks": {
    "keyPartners":           { "id": "keyPartners", ... },
    "keyActivities":         { "id": "keyActivities", ... },
    "valuePropositions":     { "id": "valuePropositions", ... },
    "customerRelationships": { "id": "customerRelationships", ... },
    "customerSegments":      { "id": "customerSegments", ... },
    "keyResources":          { "id": "keyResources", ... },
    "channels":              { "id": "channels", ... },
    "costStructure":         { "id": "costStructure", ... },
    "revenueStreams":        { "id": "revenueStreams", ... }
  },
  "analysis": {
    "summary": string,
    "swot": { "strengths": string[], "weaknesses": string[], "opportunities": string[], "threats": string[] },
    "coherence":       { "score": 0-100, "notes": string[] },
    "innovationLens":  { "score": 0-100, "signals": string[] },
    "recommendations": string[]
  }
}

Chaque bloc: { "id": string, "items": string[], "justification": string, "sources": string[], "confidence": 0-100, "status": "verified"|"estimated"|"incomplete", "flags"?: string[] }

Les ids de "sources" doivent correspondre à ceux de l'EVIDENCE; tu peux aussi rajouter tes propres entrées dans le tableau racine \`sources\` si tu cites une source mentionnée dans l'EVIDENCE mais pas encore listée.`;

/** User message for Anthropic (the system prompt already carries the rules). */
export function userPrompt(
  companyName: string,
  hints?: {
    country?: string;
    sector?: string;
    website?: string;
    language?: "fr" | "en" | "ar";
  }
) {
  const lang = hints?.language ?? "fr";
  return `Entreprise cible: **${companyName}**${hints?.country ? ` (pays: ${hints.country})` : ""}${hints?.sector ? ` — secteur: ${hints.sector}` : ""}${hints?.website ? ` — site: ${hints.website}` : ""}.

Langue de sortie: ${lang === "fr" ? "français" : lang === "en" ? "anglais" : "arabe"}.

Génère le Business Model Canvas complet, avec analyse synthétique, en respectant toutes les règles et le schéma JSON fourni. Si tu ne connais pas l'entreprise avec certitude, marque les blocs concernés \`incomplete\` plutôt que d'inventer.`;
}

/**
 * User message for OpenRouter — embeds the collected evidence so the model
 * can ground its answer. Each evidence piece is truncated to stay within
 * reasonable context for free models.
 */
export function userPromptWithEvidence(
  companyName: string,
  evidence: Evidence[],
  hints?: {
    country?: string;
    sector?: string;
    website?: string;
    language?: "fr" | "en" | "ar";
  }
) {
  const lang = hints?.language ?? "fr";
  const lines: string[] = [];
  lines.push(
    `Entreprise cible: **${companyName}**${hints?.country ? ` (pays: ${hints.country})` : ""}${hints?.sector ? ` — secteur: ${hints.sector}` : ""}${hints?.website ? ` — site: ${hints.website}` : ""}.`
  );
  lines.push("");
  lines.push(
    `Langue de sortie: ${lang === "fr" ? "français" : lang === "en" ? "anglais" : "arabe"}.`
  );
  lines.push("");
  lines.push("## EVIDENCE (sources collectées pour cette analyse)");
  lines.push(
    "Utilise UNIQUEMENT ces pièces pour fonder le BMC. Référence leurs ids dans le champ `sources` de chaque bloc."
  );
  lines.push("");

  const cap = evidence.length > 6 ? 2200 : 3200;
  evidence.forEach((e, i) => {
    lines.push(
      `--- [${e.source.id}] rank=${e.source.rank} · ${e.source.category} · ${e.source.publisher ?? ""}`
    );
    lines.push(`Titre: ${e.source.title}`);
    if (e.source.url) lines.push(`URL: ${e.source.url}`);
    lines.push("Contenu:");
    lines.push(e.text.slice(0, cap));
    lines.push("");
  });

  lines.push("## TÂCHE");
  lines.push(
    "Produis le JSON strict décrit dans le system prompt. Aucun texte hors JSON, aucun markdown."
  );
  return lines.join("\n");
}
