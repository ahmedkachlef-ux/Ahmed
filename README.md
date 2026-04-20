# Business Model Canvas Generator

Générateur dynamique de **Business Model Canvas** (Osterwalder & Pigneur) avec recherche web en temps réel.

Vous entrez le nom d'une entreprise, le modèle effectue une recherche web, structure les informations selon les **9 blocs standards** du BMC, ajoute une **analyse stratégique** pour chacun et produit une **synthèse globale**.

**Deux fournisseurs supportés** :
- **Anthropic direct** (Claude Opus/Sonnet/Haiku) — recherche web native via l'outil `web_search`.
- **OpenRouter** — accès à Claude, GPT-5, Gemini, Llama, Mistral, Grok, DeepSeek… avec recherche web via le suffixe `:online`.

## Les 9 blocs générés

1. **Partenaires clés** — qui soutient l'activité ?
2. **Activités clés** — que faut-il faire pour délivrer la valeur ?
3. **Ressources clés** — quels actifs sont indispensables ?
4. **Proposition de valeur** — quel problème résolu pour quel gain ?
5. **Relations clients** — comment la relation est-elle entretenue ?
6. **Canaux** — comment la valeur atteint-elle le client ?
7. **Segments de clientèle** — pour qui créons-nous de la valeur ?
8. **Structure de coûts** — qu'est-ce qui coûte le plus ?
9. **Sources de revenus** — comment l'entreprise monétise-t-elle ?

Pour chaque bloc : 3 à 6 éléments + une analyse stratégique. Plus une synthèse globale avec les sources consultées.

## Lancer l'application

Le projet est 100 % statique (HTML/CSS/JS vanilla). Aucun build n'est nécessaire.

```bash
# Depuis la racine du projet
python3 -m http.server 8080
# puis ouvrez http://localhost:8080
```

Vous pouvez aussi ouvrir `index.html` directement dans votre navigateur.

## Configuration

Au premier lancement, une fenêtre vous demande :

- Le **fournisseur** : `Anthropic` ou `OpenRouter` (par défaut).
- Votre **clé API** :
  - Anthropic : format `sk-ant-…` → <https://console.anthropic.com/settings/keys>
  - OpenRouter : format `sk-or-…` → <https://openrouter.ai/keys>
- Le **modèle** :
  - Anthropic : Opus 4.7, Sonnet 4.6, Haiku 4.5
  - OpenRouter : champ libre avec suggestions (`anthropic/claude-sonnet-4.5`, `openai/gpt-5`, `google/gemini-2.5-pro`, `meta-llama/llama-3.3-70b-instruct`, `x-ai/grok-4`, `deepseek/deepseek-chat`, etc. — tout ID OpenRouter valide fonctionne).
- L'activation de la **recherche web** (recommandée). Pour OpenRouter, le suffixe `:online` est ajouté automatiquement au modèle.

La clé est stockée uniquement dans le `localStorage` de votre navigateur.

## Fonctionnalités

- Interface moderne (dark, gradients, glass-morphism)
- Layout fidèle au BMC officiel (5 colonnes × 2 rangées + coûts/revenus)
- Recherche web intégrée via l'outil `web_search` de Claude
- Analyse stratégique dépliable par bloc
- Synthèse stratégique globale + sources cliquables
- Export PDF via impression navigateur
- Responsive (desktop / tablette / mobile)

## Pile technique

- HTML5 + CSS3 (Grid, backdrop-filter, color-mix)
- JavaScript vanilla (Fetch API, `<dialog>`)
- API Anthropic `messages` avec outil `web_search_20250305`
- API OpenRouter (compatible OpenAI) avec suffixe de modèle `:online` pour la recherche web
