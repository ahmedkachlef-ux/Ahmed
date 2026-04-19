# CanvasAI — BMC Generator

Plateforme web intelligente qui génère automatiquement le **Business Model Canvas** d'une entreprise à partir de son nom, en s'appuyant uniquement sur des **sources publiques fiables et hiérarchisées**, et qui produit une **analyse stratégique synthétique** (résumé exécutif, SWOT, cohérence inter-blocs, innovation lens, recommandations).

Pas de hallucinations : chaque bloc du BMC est tracé jusqu'à ses sources, scoré en confiance et marqué `vérifié / estimé / incomplet`.

---

## Stack

- **Frontend** — Next.js 14 (App Router) · TypeScript · Tailwind CSS · UI primitives shadcn-style inline · Framer Motion
- **Collecte réelle** — scraping DuckDuckGo (HTML, sans clé) + Wikipedia REST API + fetch du site officiel, avec classement automatique des sources en 7 tiers de fiabilité
- **LLM** — **OpenRouter** (modèle gratuit `meta-llama/llama-3.3-70b-instruct:free` par défaut) en priorité, fallback **Anthropic** (`claude-opus-4-7`, adaptive thinking + prompt caching), fallback mock déterministe
- **Sortie structurée** — JSON Schema + validation Zod + `parseAndRepair` qui répare les champs manquants et extrait le JSON même s'il est enveloppé dans du markdown
- **Stockage** — Adapter file-system (`data/analyses/*.json`, `data/feedback/*.json`) — interface `Store` swappable vers Postgres / MongoDB
- **Streaming** — NDJSON streaming pour exposer en temps réel les étapes du pipeline

---

## Installation

```bash
npm install
cp .env.example .env.local
# → édite .env.local et colle ta clé OpenRouter (gratuite)
npm run dev
```

Ouvre http://localhost:3000.

### Obtenir une clé OpenRouter gratuite (2 minutes)

1. Va sur https://openrouter.ai/ et crée un compte (pas de CB requise pour le tier gratuit).
2. Va sur https://openrouter.ai/keys et crée une clé.
3. Colle-la dans `.env.local` : `OPENROUTER_API_KEY=sk-or-v1-…`
4. Redémarre `npm run dev`.

### Priorité des providers

| Clé présente          | Mode                       | Modèle par défaut                             |
| --------------------- | -------------------------- | --------------------------------------------- |
| `OPENROUTER_API_KEY`  | **OpenRouter** (réel)      | `meta-llama/llama-3.3-70b-instruct:free`      |
| `ANTHROPIC_API_KEY`   | Anthropic (réel, payant)   | `claude-opus-4-7`                             |
| aucune                | mock déterministe          | —                                             |

Seule **une** clé suffit. Si tu mets les deux, OpenRouter gagne (ordre modifiable dans `lib/ai/pipeline.ts` → `selectMode`).

---

## Pages

| Route                | Rôle                                                                         |
| -------------------- | ---------------------------------------------------------------------------- |
| `/`                  | Landing — proposition de valeur, features, exemple d'API                     |
| `/analyze`           | Saisie + filtres (pays, secteur, langue) + pipeline streaming visible        |
| `/result/[id]`       | Vue Canvas / Liste / Analyse / Sources, side-panel sources & justification   |
| `/edit/[id]`         | Édition manuelle de chaque bloc (items, justification, statut, sources, conf) |
| `/history`           | Toutes les analyses sauvegardées                                             |
| `/compare`           | 2 BMC côte à côte                                                            |
| `/admin`             | KPIs (live vs mock, confiance moyenne), feedback utilisateurs                |

---

## API

| Endpoint                                  | Méthode | Description                                              |
| ----------------------------------------- | ------- | -------------------------------------------------------- |
| `/api/analyze`                            | POST    | Stream NDJSON: événements `progress` puis `result {id}`  |
| `/api/analyses`                           | GET     | Liste des résumés (id, nom, secteur, confiance, mode)    |
| `/api/analyses/[id]`                      | GET     | Analyse complète                                         |
| `/api/analyses/[id]`                      | PATCH   | Édition (incrémente `meta.version`)                      |
| `/api/analyses/[id]`                      | DELETE  | Suppression                                              |
| `/api/analyses/[id]/export?format=json`   | GET     | Export JSON                                              |
| `/api/analyses/[id]/export?format=csv`    | GET     | Export CSV (1 ligne / bloc)                              |
| `/api/analyses/[id]/export?format=md`     | GET     | Rapport synthétique avec sources                         |
| `/api/feedback`                           | POST    | Poster un feedback (`analysisId`, `rating 1-5`, comment) |
| `/api/feedback?analysisId=…`              | GET     | Lister les feedbacks                                     |

---

## Architecture

```
app/
  layout.tsx, globals.css, page.tsx            ← landing
  analyze/                                     ← saisie + streaming
  result/[id]/                                 ← canvas + analyse + sources
  edit/[id]/                                   ← édition manuelle
  history/, compare/, admin/
  api/
    analyze/                                   ← POST stream NDJSON
    analyses/                                  ← GET liste
    analyses/[id]/                             ← GET PATCH DELETE
    analyses/[id]/export/                      ← GET ?format=json|csv|md
    feedback/                                  ← POST GET

components/
  ui/                                          ← Button, Card, Input, Badge, Tabs, Progress
  bmc/                                         ← Canvas (layout 9 blocs), Block, SourcesPanel,
                                                 ConfidenceBadge, AnalysisPanel
  search/                                      ← SearchBar, ProgressSteps
  Navbar.tsx

lib/
  types.ts                                     ← BlockId, BmcBlock, BmcAnalysis, ProgressEvent…
  bmc-schema.ts                                ← Zod + JSON Schema strict
  utils.ts                                     ← cn, slugify, shortId, format helpers
  ai/
    openrouter.ts                              ← OpenRouter client + extractJsonObject
    client.ts                                  ← Anthropic client (fallback)
    prompts.ts                                 ← SYSTEM_PROMPT + userPromptWithEvidence
    validators.ts                              ← parseAndRepair, coherenceWarnings
    pipeline.ts                                ← runPipeline + selectMode (OR > Anthropic > mock)
    mock.ts                                    ← BMC déterministe (no key)
  sources/
    fetcher.ts                                 ← fetchText + htmlToText
    search.ts                                  ← DuckDuckGo HTML scrape
    wikipedia.ts                               ← wikiSummary + wikiSearch
    collector.ts                               ← collectEvidence orchestrator
    ranking.ts                                 ← SOURCE_TIERS (1–7), inferRank, rankSources
  storage/
    index.ts                                   ← Store interface + toSummary
    fs-store.ts                                ← implémentation file-system
data/                                          ← persisté (gitignored)
```

---

## Pipeline IA

```
search              collect                    generate              validate              analyze
──────              ───────                    ────────              ────────              ───────
DuckDuckGo HTML  →  fetch parallel 6 pages  →  OpenRouter LLM     →  extractJsonObject  →  coherenceWarnings
Wikipedia REST      htmlToText (strip tags)    system: règles BMC    parseAndRepair        SWOT, innovation
Site officiel       classify + rank 1-7        user: evidence ids    Zod schema            recommendations
                                               response_format:      fallback mock
                                               json_object
```

### Collecte réelle (sans clé, gratuite)

`lib/sources/collector.ts` orchestre la collecte :

1. **Wikipedia summary** (REST API `api/rest_v1/page/summary`) en FR et EN — résout le titre canonique via `list=search` si besoin.
2. **DuckDuckGo HTML** (`html.duckduckgo.com/html/?q=...`) sur 5 angles : business model, revenus/clients, secteur, partenaires, mission — déduplication par URL.
3. **Site officiel** fetché directement si l'utilisateur le fournit en filtre.
4. **Top 6 URLs** fetchées en parallèle avec timeout 8s, UA custom, `htmlToText` (strip `<script>/<style>/<!-- -->`, décodage d'entités, collapse whitespace), capé à 6000 chars/page.
5. **Classification automatique** par host → tier 1-7 (site officiel → IR/annualreport → SEC/AMF → INSEE/Companies House → press releases → FT/WSJ/Les Echos → Crunchbase/Statista).

### Décisions IA

- **Modèle** : `claude-opus-4-7` (override via `ANTHROPIC_MODEL`)
- **Effort** : `high` par défaut (`ANTHROPIC_EFFORT` accepte `low|medium|high|xhigh|max`)
- **Adaptive thinking** : `thinking: { type: "adaptive" }` — Claude module sa profondeur de raisonnement
- **Prompt caching** : `cache_control: { type: "ephemeral" }` posé sur le `SYSTEM_PROMPT` (stable, ~3 KB de définitions BMC + règles) pour réduire le coût des analyses répétées
- **Sortie structurée** : `output_config.format = { type: "json_schema", schema: bmcJsonSchema }` — le modèle retourne strictement le schéma attendu, validé en sortie par Zod
- **Streaming** : `client.messages.stream(...)` puis `stream.finalMessage()` pour éviter les timeouts sur les longues générations

### Anti-hallucination

1. Le system prompt impose une règle absolue : `incomplete` plutôt que d'inventer.
2. `verified` exige au moins une source de rank ≤ 3.
3. `parseAndRepair` (lib/ai/validators.ts) répare les blocs manquants en `incomplete` au lieu d'échouer.
4. `coherenceWarnings` détecte les blocs `verified` sans source rattachée — warning automatique poussé dans `analysis.coherence.notes`.

### Hiérarchie des sources (rank 1 = plus fiable)

| Rank | Catégorie                                                  |
| ---- | ---------------------------------------------------------- |
| 1    | Site officiel (corporate, IR)                              |
| 2    | Rapports annuels / URD / 10-K                              |
| 3    | Documents réglementaires (SEC, AMF, ESMA…)                 |
| 4    | Registres officiels (INSEE, Companies House, RCS…)         |
| 5    | Communiqués de presse officiels                            |
| 6    | Presse économique reconnue (FT, WSJ, Les Echos…)           |
| 7    | Bases professionnelles (Crunchbase, Pitchbook, Statista…)  |

---

## Modèle de données

```ts
BmcAnalysis {
  id, company { name, legalName?, country?, sector?, website?, description? },
  blocks: Record<BlockId, BmcBlock>,
  sources: Source[],
  analysis: {
    summary, swot, coherence { score, notes }, innovationLens { score, signals }, recommendations
  },
  meta: { createdAt, updatedAt, model, mode: "live" | "mock", durationMs?, version }
}

BmcBlock {
  id, items[], justification, sources[],   // ids référant à BmcAnalysis.sources
  confidence (0-100), status: "verified" | "estimated" | "incomplete",
  notes?, flags?
}

Source {
  id, title, url?, publisher?, date?, rank (1-7), category
}
```

---

## UX

- **Design épuré** sur fond `ink-950` avec accents `brand` ; grille radiale subtile en background.
- **Layout BMC canonique** : Partenaires (gauche pleine hauteur), Activités/Ressources (col 2), Propositions de Valeur (centre, surlignées), Relations/Canaux (col 4), Segments (droite pleine hauteur), Coûts (bas-gauche), Revenus (bas-droite, surlignés).
- **Side panel sources** glisse depuis la droite avec définition canonique, contenu, justification, sources rangées par rank.
- **Vues alternatives** : Canvas / Liste / Analyse / Sources (Tabs).
- **Étapes de chargement visibles** : Identification → Recherche → Collecte → Génération → Validation → Analyse → Terminé, avec barre de progression et journal détaillé.
- **Badges visuels** : confiance (Élevée/Moyenne/Faible) + statut (Vérifié/Estimé/Incomplet).
- **Animations sobres** : Framer Motion uniquement sur entrées et hover des blocs.

---

## Plan d'évolution

### v0.2
- RAG + embeddings : ingestion d'URLs / PDFs et reranking
- Mode collaboratif (commentaires par bloc)
- Connecteurs réels (SEC EDGAR, INSEE, OpenCorporates, Wikidata)

### v0.3
- Auth (NextAuth) + workspaces
- Postgres adapter + Drizzle ORM
- Export PDF/PNG via Puppeteer côté serveur
- i18n complet (FR/EN/AR avec RTL)

### v0.4
- "Diff" entre versions d'un même BMC (timeline)
- Suggestions IA d'amélioration par bloc (mode coach)
- Détection automatique d'incohérences inter-blocs étendue
- Webhooks pour intégrations CRM / outils de veille

### v0.5
- Managed Agents pour ingestion de longue durée (collecte multi-sources, rapports déposés en file mounts)
- Compaction sur conversations longues d'analyse
- Mode "deep research" multi-agent

---

## Variables d'environnement

| Variable                | Défaut                                         | Description                                                         |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| `OPENROUTER_API_KEY`    | —                                              | **Priorité 1.** Clé gratuite sur https://openrouter.ai/keys         |
| `OPENROUTER_MODEL`      | `meta-llama/llama-3.3-70b-instruct:free`       | Modèle OpenRouter (préférer les `:free`)                            |
| `OPENROUTER_REFERRER`   | `https://canvasai.local`                       | Header HTTP-Referer (attribution)                                   |
| `ANTHROPIC_API_KEY`     | —                                              | **Priorité 2.** Fallback Claude Opus 4.7                            |
| `ANTHROPIC_MODEL`       | `claude-opus-4-7`                              | Override du modèle                                                  |
| `ANTHROPIC_EFFORT`      | `high`                                         | `low` \| `medium` \| `high` \| `xhigh` \| `max`                     |
| `DATA_DIR`              | `./data`                                       | Racine du stockage file-system                                      |

Sans aucune clé, le pipeline retombe en mode mock déterministe (idéal pour CI / démo visuelle).

---

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm start          # production server
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```
