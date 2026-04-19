export type BlockId =
  | "keyPartners"
  | "keyActivities"
  | "valuePropositions"
  | "customerRelationships"
  | "customerSegments"
  | "keyResources"
  | "channels"
  | "costStructure"
  | "revenueStreams";

export const BLOCK_ORDER: BlockId[] = [
  "keyPartners",
  "keyActivities",
  "valuePropositions",
  "customerRelationships",
  "customerSegments",
  "keyResources",
  "channels",
  "costStructure",
  "revenueStreams"
];

export const BLOCK_META: Record<
  BlockId,
  { fr: string; en: string; definition: string; examples: string }
> = {
  keyPartners: {
    fr: "Partenaires Clés",
    en: "Key Partners",
    definition:
      "Réseau de fournisseurs, alliances stratégiques, joint-ventures, sous-traitants — acteurs externes nécessaires au fonctionnement.",
    examples: "fournisseurs critiques, distributeurs, alliances technologiques"
  },
  keyActivities: {
    fr: "Activités Clés",
    en: "Key Activities",
    definition:
      "Processus opérationnels et stratégiques essentiels à la création de valeur (production, R&D, marketing, opérations).",
    examples: "production, R&D, plateforme logicielle, logistique"
  },
  valuePropositions: {
    fr: "Propositions de Valeur",
    en: "Value Propositions",
    definition:
      "Bénéfices concrets et différenciants offerts aux clients — problème résolu, promesse, positionnement.",
    examples: "qualité, rapidité, prix, personnalisation, simplicité"
  },
  customerRelationships: {
    fr: "Relations Clients",
    en: "Customer Relationships",
    definition:
      "Types d'interactions avec les segments — acquisition, fidélisation, self-service, communauté.",
    examples: "support dédié, communauté, self-service, co-création"
  },
  customerSegments: {
    fr: "Segments Clientèle",
    en: "Customer Segments",
    definition:
      "Groupes de clients visés : marché de masse, niche, segmenté, B2B/B2C, multi-face.",
    examples: "B2B PME, grand public, entreprises mid-market"
  },
  keyResources: {
    fr: "Ressources Clés",
    en: "Key Resources",
    definition:
      "Actifs nécessaires : humains, physiques, intellectuels, financiers — ce qui permet de délivrer la proposition de valeur.",
    examples: "marque, data, équipe tech, infrastructure"
  },
  channels: {
    fr: "Canaux de Distribution",
    en: "Channels",
    definition:
      "Voies par lesquelles l'entreprise touche et sert ses segments — communication, vente, livraison, après-vente.",
    examples: "site web, retail, app, partenaires, force de vente"
  },
  costStructure: {
    fr: "Structure de Coûts",
    en: "Cost Structure",
    definition:
      "Principaux postes de coûts fixes et variables — modèle à coûts ou à valeur, économies d'échelle, de gamme.",
    examples: "masse salariale, R&D, infrastructure cloud, marketing"
  },
  revenueStreams: {
    fr: "Sources de Revenus",
    en: "Revenue Streams",
    definition:
      "Mécanismes de monétisation — vente, abonnement, licence, commission, publicité, freemium.",
    examples: "abonnement SaaS, transaction, licence, publicité"
  }
};

export type BlockStatus = "verified" | "estimated" | "incomplete";

export interface Source {
  id: string;
  title: string;
  url?: string;
  publisher?: string;
  date?: string;
  /** Rank 1 (most reliable) → 7. See lib/sources/ranking.ts for the tiers. */
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Free-form label of the source category ("site officiel", "rapport annuel"…) */
  category: string;
}

export interface BmcBlock {
  id: BlockId;
  items: string[];
  justification: string;
  sources: string[]; // Source ids
  /** 0 – 100 */
  confidence: number;
  status: BlockStatus;
  notes?: string;
  /** Present only when the model couldn't substantiate the block. */
  flags?: string[];
}

export interface BmcAnalysis {
  id: string;
  company: {
    name: string;
    legalName?: string;
    country?: string;
    sector?: string;
    website?: string;
    description?: string;
  };
  blocks: Record<BlockId, BmcBlock>;
  sources: Source[];
  analysis: {
    summary: string;
    swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
    coherence: { score: number; notes: string[] };
    innovationLens: { score: number; signals: string[] };
    recommendations: string[];
  };
  meta: {
    createdAt: string;
    updatedAt: string;
    model: string;
    mode: "live" | "mock";
    durationMs?: number;
    version: number;
  };
}

export interface AnalysisSummary {
  id: string;
  name: string;
  sector?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  globalConfidence: number;
  mode: "live" | "mock";
}

export interface ProgressEvent {
  step:
    | "started"
    | "search"
    | "collect"
    | "rank"
    | "generate"
    | "validate"
    | "analyze"
    | "done"
    | "error";
  message: string;
  percent: number;
  at: string;
  detail?: unknown;
}

export interface Feedback {
  id: string;
  analysisId: string;
  blockId?: BlockId;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: string;
}
