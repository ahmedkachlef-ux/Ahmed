#!/usr/bin/env python3
"""
BMC Generator — backend Flask.

Sert les fichiers statiques (index.html, styles.css, app.js) et expose :
  - POST /api/generate   { "company": "...", "model": "..."? }
  - GET  /api/models     → liste des modèles OpenRouter gratuits
  - GET  /api/config     → modèle par défaut, état clé API

La clé API OpenRouter est lue dans cet ordre de priorité :
  1. Variable d'environnement OPENROUTER_API_KEY
  2. Fichier local_config.py (ignoré par git — pour usage personnel)
Elle n'est jamais envoyée au navigateur.

Lancement :
    pip install -r requirements.txt
    # option A : variable d'environnement
    export OPENROUTER_API_KEY="sk-or-v1-..."
    # option B : créer local_config.py avec OPENROUTER_API_KEY = "sk-or-v1-..."
    python server.py
    # puis ouvrir http://127.0.0.1:8000
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from bmc_cli import (
    call_openrouter,
    extract_json,
    fetch_free_models,
    validate_bmc,
)

# Optional local config file (gitignored). Create `local_config.py` next to
# this file with: OPENROUTER_API_KEY = "sk-or-v1-..." (and optionally
# OPENROUTER_MODEL = "..."). Env vars still take precedence.
try:
    import local_config  # type: ignore
except ImportError:
    local_config = None  # type: ignore


def get_api_key() -> str | None:
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key and local_config is not None:
        key = getattr(local_config, "OPENROUTER_API_KEY", None)
    return key or None


def get_default_model() -> str:
    env_model = os.environ.get("OPENROUTER_MODEL")
    if env_model:
        return env_model
    if local_config is not None:
        local_model = getattr(local_config, "OPENROUTER_MODEL", None)
        if local_model:
            return local_model
    return "openai/gpt-3.5-turbo"


ROOT = Path(__file__).resolve().parent
DEFAULT_MODEL = get_default_model()

app = Flask(__name__, static_folder=str(ROOT), static_url_path="")


# ─────────────────────────── Static ───────────────────────────

@app.get("/")
def index():
    return send_from_directory(str(ROOT), "index.html")


# ─────────────────────────── API ──────────────────────────────

@app.get("/api/config")
def api_config():
    return jsonify({
        "hasApiKey": bool(get_api_key()),
        "defaultModel": DEFAULT_MODEL,
    })


@app.get("/api/models")
def api_models():
    try:
        free = fetch_free_models()
    except Exception as exc:
        return jsonify({"error": f"Impossible de récupérer la liste des modèles : {exc}"}), 502
    return jsonify({"free": free})


@app.post("/api/generate")
def api_generate():
    api_key = get_api_key()
    if not api_key:
        return jsonify({"error": "OPENROUTER_API_KEY non définie côté serveur."}), 500

    payload = request.get_json(silent=True) or {}
    company = (payload.get("company") or "").strip()
    if not company:
        return jsonify({"error": "Paramètre 'company' requis."}), 400

    model = (payload.get("model") or DEFAULT_MODEL).strip()

    try:
        raw = call_openrouter(api_key, company, model, insecure=False)
        bmc = extract_json(raw)
        validate_bmc(bmc)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify(bmc)


# ─────────────────────────── Entrypoint ───────────────────────

def main() -> int:
    if not get_api_key():
        print(
            "⚠  OPENROUTER_API_KEY introuvable (ni en variable d'environnement, "
            "ni dans local_config.py). /api/generate renverra 500.",
            file=sys.stderr,
        )

    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"

    print(f"→ BMC Generator en écoute sur http://{host}:{port}", file=sys.stderr)
    app.run(host=host, port=port, debug=debug)
    return 0


if __name__ == "__main__":
    sys.exit(main())
