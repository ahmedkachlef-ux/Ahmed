# Business Model Canvas Generator

Générateur dynamique de **Business Model Canvas** (Osterwalder & Pigneur) basé sur OpenRouter.

Vous entrez le nom d'une entreprise, un LLM analyse son modèle d'affaires, structure l'information selon les **9 blocs standards** du BMC, ajoute une **analyse stratégique** par bloc et conclut par une **synthèse globale**.

## Architecture

```
┌──────────┐  POST /api/generate  ┌──────────────┐   HTTPS   ┌────────────┐
│ Frontend │ ───────────────────► │  server.py   │ ────────► │ OpenRouter │
│ (HTML/JS)│ ◄─────────────────── │   (Flask)    │ ◄──────── │    API     │
└──────────┘      JSON BMC        └──────────────┘           └────────────┘
                                         ▲
                                  OPENROUTER_API_KEY
                                  (env var, jamais dans le navigateur)
```

La clé API vit **uniquement côté serveur**. Le navigateur n'envoie que le nom d'entreprise.

## Les 9 blocs générés

1. **Partenaires clés** · 2. **Activités clés** · 3. **Ressources clés** ·
4. **Proposition de valeur** · 5. **Relations clients** · 6. **Canaux** ·
7. **Segments de clientèle** · 8. **Structure de coûts** · 9. **Sources de revenus**

Pour chaque bloc : 3 à 6 éléments + analyse stratégique. Plus une synthèse globale.

## Lancer l'application web

```bash
pip install -r requirements.txt
```

Deux façons de fournir la clé API OpenRouter (priorité : env var > fichier local) :

**Option A — variable d'environnement**

```bash
# Linux / macOS
export OPENROUTER_API_KEY="sk-or-v1-…"
# Windows PowerShell
$env:OPENROUTER_API_KEY = "sk-or-v1-…"
python server.py
```

**Option B — fichier `local_config.py`** (pratique sur Windows, pas de PowerShell)

```bash
cp local_config.example.py local_config.py   # ou copier manuellement
# Éditez local_config.py et remplissez OPENROUTER_API_KEY
python server.py
```

`local_config.py` est **ignoré par git** — la clé ne risque pas d'être poussée accidentellement.

Puis ouvrez **http://127.0.0.1:8000**.

Dans l'interface :
- Entrez un nom d'entreprise (ou cliquez sur un chip d'exemple).
- Cliquez sur ⚙️ pour changer de modèle (liste chargée depuis OpenRouter). Laisser vide = utiliser `OPENROUTER_MODEL` du serveur.

## Lancer le CLI (alternative)

Pour un usage scripté ou en terminal sans serveur :

```bash
pip install -r requirements.txt
export OPENROUTER_API_KEY="sk-or-v1-…"

python bmc_cli.py "Spotify"
python bmc_cli.py --model google/gemini-2.0-flash-exp:free "Airbnb"
python bmc_cli.py -o tesla.json "Tesla"
python bmc_cli.py --raw "Patagonia" | jq .
```

Options : `--model`, `-o`, `--raw`, `--insecure`, `--timeout`. Voir `python bmc_cli.py --help`.

## Endpoints du serveur

| Méthode | URL             | Description                                         |
| ------- | --------------- | --------------------------------------------------- |
| `GET`   | `/`             | Sert l'interface web                                |
| `GET`   | `/api/config`   | Indique si la clé API est configurée + modèle défaut |
| `GET`   | `/api/models`   | Liste des modèles OpenRouter avec `pricing = 0`     |
| `POST`  | `/api/generate` | Body `{ "company": "...", "model": "...?" }` → BMC JSON |

## Mode 100 % gratuit

Créez une clé gratuite sur <https://openrouter.ai/keys> (pas de carte bancaire). Dans l'UI, choisissez un modèle avec le suffixe `:free` — DeepSeek, Llama 3.3, Gemini Flash, Qwen, Mistral Small, etc. Rate limits appliqués par OpenRouter.

## Fichiers

```
Ahmed/
├── server.py           # Backend Flask
├── bmc_cli.py          # CLI indépendant (réutilisé par server.py)
├── app.js              # Frontend, appelle /api/generate
├── index.html          # Mise en page BMC
├── styles.css          # Thème sombre moderne
├── requirements.txt    # Flask + requests
└── .env.example        # Gabarit de config
```

## Sécurité

- La clé n'est jamais exposée au navigateur, jamais dans git (`.env` est ignoré).
- N'ajoutez pas `--insecure` en production (le flag désactive la vérification SSL).
- Le serveur écoute sur `127.0.0.1` par défaut. Pour l'exposer publiquement, mettez un reverse-proxy avec auth devant.
