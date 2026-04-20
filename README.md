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
  - OpenRouter : modèles **100 % gratuits** par défaut (suffixe `:free`) — DeepSeek V3, DeepSeek R1, Llama 3.3 70B, Gemini 2.0 Flash, Qwen 2.5 72B, Mistral Small 3.1… ou n'importe quel ID OpenRouter valide.
- L'activation de la **recherche web** (optionnelle).
  - Anthropic : outil natif `web_search`, facturé par l'API.
  - OpenRouter : suffixe `:online` (plugin Exa, payant ~4 $ / 1000 requêtes). **Désactivé automatiquement** si vous choisissez un modèle `:free` — l'analyse s'appuie alors sur les connaissances intégrées au modèle.

### Mode 100 % gratuit

Par défaut, le fournisseur est **OpenRouter** avec le modèle `deepseek/deepseek-chat-v3-0324:free` et la recherche web **désactivée**. Il suffit de créer un compte sur <https://openrouter.ai/keys> pour obtenir une clé gratuite — aucune carte bancaire requise, dans les limites de taux des modèles `:free`.

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
