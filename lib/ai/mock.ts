import type { BmcResponse } from "../bmc-schema";

/**
 * Deterministic mock generator used when ANTHROPIC_API_KEY is missing.
 * It lets the UI + pipeline run end-to-end without an API key, for demos,
 * CI smoke tests, and local dev.
 */
export function mockBmc(name: string): BmcResponse {
  const lower = name.toLowerCase();
  const isTech =
    /(tech|soft|saas|ai|digital|data|app|cloud|labs)/.test(lower) || name.length < 4;
  const sector = isTech ? "Technologie / SaaS" : "Services";
  const sources: BmcResponse["sources"] = [
    { id: "s1", title: `${name} — site officiel`, url: `https://example.com/${encodeURIComponent(lower)}`, publisher: name, rank: 1, category: "site officiel" },
    { id: "s2", title: `Rapport annuel 2024 — ${name}`, publisher: name, date: "2025-03-15", rank: 2, category: "rapport annuel" },
    { id: "s3", title: `Registre INSEE`, publisher: "INSEE", rank: 4, category: "registre officiel" },
    { id: "s4", title: `Communiqué — nouvelle levée`, publisher: name, date: "2025-11-02", rank: 5, category: "communiqué" },
    { id: "s5", title: `Les Echos — dossier sectoriel`, publisher: "Les Echos", date: "2025-09-10", rank: 6, category: "presse économique" },
    { id: "s6", title: `Crunchbase profile`, publisher: "Crunchbase", rank: 7, category: "base professionnelle" }
  ];

  const block = (
    id: string,
    items: string[],
    justification: string,
    srcs: string[],
    confidence: number
  ) => ({
    id,
    items,
    justification,
    sources: srcs,
    confidence,
    status: confidence >= 75 ? "verified" : confidence >= 45 ? "estimated" : "incomplete"
  });

  return {
    company: {
      name,
      legalName: `${name} SAS`,
      country: "France",
      sector,
      website: `https://example.com/${encodeURIComponent(lower)}`,
      description: `${name} est une entreprise ${isTech ? "technologique" : "de services"} opérant sur son marché depuis plusieurs années. Cette fiche est un rendu de démonstration (mode mock).`
    },
    sources,
    blocks: {
      keyPartners: block(
        "keyPartners",
        ["Fournisseurs cloud (AWS, GCP)", "Intégrateurs partenaires", "Écosystème de revendeurs"],
        "L'entreprise s'appuie sur des partenariats techniques et commerciaux classiques pour son secteur.",
        ["s1", "s2"],
        78
      ),
      keyActivities: block(
        "keyActivities",
        ["Développement produit", "Support client", "Go-to-market B2B", "Conformité & sécurité"],
        "Activités opérationnelles typiques d'un acteur du secteur.",
        ["s2", "s4"],
        72
      ),
      valuePropositions: block(
        "valuePropositions",
        ["Gain de productivité", "Intégrations prêtes à l'emploi", "SLA entreprise", "UX soignée"],
        "La proposition de valeur combine simplicité d'usage et robustesse attendue sur un marché B2B.",
        ["s1"],
        80
      ),
      customerRelationships: block(
        "customerRelationships",
        ["Customer Success dédié", "Self-service", "Communauté utilisateurs"],
        "Modèle hybride assisté + self-service fréquent dans le segment.",
        ["s1", "s5"],
        60
      ),
      customerSegments: block(
        "customerSegments",
        ["PME en croissance", "Mid-market", "Équipes techniques"],
        "Segments inférés depuis la communication commerciale publique.",
        ["s1", "s5"],
        65
      ),
      keyResources: block(
        "keyResources",
        ["Équipe ingénierie", "Plateforme logicielle propriétaire", "Marque", "Données d'usage"],
        "Ressources clés classiques pour ce type d'acteur.",
        ["s2", "s6"],
        68
      ),
      channels: block(
        "channels",
        ["Site web + essai gratuit", "Vente directe", "Partenaires revendeurs", "Marketing de contenu"],
        "Canaux mixtes typiques du GTM B2B moderne.",
        ["s1", "s5"],
        70
      ),
      costStructure: block(
        "costStructure",
        ["Masse salariale R&D", "Infrastructure cloud", "Sales & Marketing", "Conformité"],
        "Structure de coûts dominée par la R&D et le GTM — profil SaaS classique.",
        ["s2"],
        58
      ),
      revenueStreams: block(
        "revenueStreams",
        ["Abonnements annuels par siège", "Modules premium", "Services professionnels"],
        "Monétisation par abonnement + upsell modulaire.",
        ["s1", "s2"],
        74
      )
    },
    analysis: {
      summary: `${name} opère sur un marché concurrentiel mais structuré. Son modèle repose sur une plateforme logicielle packagée par abonnement, avec une double motion sales + self-service. Les sources publiques permettent de valider la proposition de valeur et la structure GTM avec un bon niveau de confiance, tandis que la structure fine des coûts reste estimative. Cette démo affiche des données synthétiques ; la génération réelle nécessite une clé Anthropic.`,
      swot: {
        strengths: ["Positionnement produit clair", "Marque reconnue sur son segment", "Partenariats structurants"],
        weaknesses: ["Dépendance à quelques grands comptes", "Structure de coûts rigide"],
        opportunities: ["Expansion internationale", "Intégration IA native", "Montée en gamme mid-market"],
        threats: ["Consolidation concurrentielle", "Pression sur les prix", "Évolution réglementaire"]
      },
      coherence: {
        score: 78,
        notes: [
          "Les segments visés sont cohérents avec la proposition de valeur et les canaux.",
          "La structure de revenus reflète bien la combinaison abonnement + services.",
          "Attention: quelques blocs s'appuient sur des sources indirectes (rank ≥ 5)."
        ]
      },
      innovationLens: {
        score: 65,
        signals: [
          "Intégration de fonctionnalités IA mentionnées publiquement",
          "Partenariats cloud stratégiques",
          "Communication sur la conformité (SOC2 / ISO)"
        ]
      },
      recommendations: [
        "Renforcer la différenciation IA comme axe de proposition de valeur.",
        "Diversifier les canaux d'acquisition via partenaires.",
        "Documenter publiquement davantage de KPIs pour améliorer la confiance analytique."
      ]
    }
  };
}
