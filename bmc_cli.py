#!/usr/bin/env python3
"""
BMC CLI — Génère un Business Model Canvas complet pour une entreprise
via l'API OpenRouter (compatible OpenAI).

Usage:
    export OPENROUTER_API_KEY="sk-or-v1-..."
    python bmc_cli.py "Spotify"
    python bmc_cli.py --model google/gemini-2.0-flash-exp:free "Airbnb"
    python bmc_cli.py -o airbnb.json "Airbnb"
    python bmc_cli.py --raw "Tesla"         # JSON brut sur stdout
    python bmc_cli.py --insecure "Patagonia" # Désactive la vérif SSL

La clé API est lue depuis la variable d'environnement OPENROUTER_API_KEY
(ou demandée interactivement). N'hardcodez JAMAIS votre clé.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import textwrap
from typing import Any

import requests

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models"


def _is_zero(value: Any) -> bool:
    if value in (None, ""):
        return False
    try:
        return float(value) == 0
    except (TypeError, ValueError):
        return False


def fetch_free_models(insecure: bool = False, timeout: int = 20) -> list[dict[str, Any]]:
    """Return a sorted list of OpenRouter models whose prompt+completion price is zero."""
    res = requests.get(OPENROUTER_MODELS_URL, timeout=timeout, verify=not insecure)
    res.raise_for_status()
    data = res.json().get("data", [])
    free = []
    for m in data:
        pricing = m.get("pricing") or {}
        if _is_zero(pricing.get("prompt")) and _is_zero(pricing.get("completion")):
            free.append({"id": m.get("id"), "name": m.get("name") or m.get("id")})
    free.sort(key=lambda x: (x["id"] or "").lower())
    return free

# ────────────────────────────────────────────────────────────────────────
#  Prompt
# ────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Tu es un expert senior en stratégie d'entreprise, spécialisé dans le modèle Business Model Canvas d'Alexander Osterwalder & Yves Pigneur.

Ton rôle :
- T'appuyer sur tes connaissances sur l'entreprise demandée (modèle d'affaires, historique, clients, partenaires, canaux, structure de coûts et de revenus publique).
- Structurer ces informations selon les 9 blocs EXACTS du Business Model Canvas.
- Pour chaque bloc, fournir 3 à 6 éléments clés (chacun avec un titre court et une description concise) ET une analyse stratégique de 2 à 4 phrases qui explique la logique, les forces, les risques ou les leviers de différenciation.
- Conclure avec une synthèse stratégique globale (3-5 phrases) : positionnement, avantages compétitifs durables, vulnérabilités, opportunités.

Règles strictes :
1. Réponds IMPÉRATIVEMENT avec un objet JSON valide, sans aucun texte avant ou après, sans balise markdown, sans commentaires.
2. Les 9 blocs doivent tous être renseignés avec du contenu spécifique à l'entreprise (pas de remplissage générique).
3. La langue de sortie est le FRANÇAIS.
4. Si l'entreprise n'existe pas ou est introuvable, retourne {"error": "Entreprise introuvable : <raison>"}.

Schéma JSON attendu :
{
  "company": {"name": "<nom officiel>", "tagline": "<1 phrase résumant l'entreprise>"},
  "blocks": {
    "keyPartnerships":       {"items": [{"title": "...", "description": "..."}, ...], "analysis": "..."},
    "keyActivities":         {"items": [...], "analysis": "..."},
    "keyResources":          {"items": [...], "analysis": "..."},
    "valuePropositions":     {"items": [...], "analysis": "..."},
    "customerRelationships": {"items": [...], "analysis": "..."},
    "channels":              {"items": [...], "analysis": "..."},
    "customerSegments":      {"items": [...], "analysis": "..."},
    "costStructure":         {"items": [...], "analysis": "..."},
    "revenueStreams":        {"items": [...], "analysis": "..."}
  },
  "synthesis": "<synthèse stratégique globale en 3-5 phrases>"
}"""


def build_user_prompt(company: str) -> str:
    return (
        f'Génère le Business Model Canvas complet de l\'entreprise suivante : "{company}".\n\n'
        "Étapes :\n"
        "1. Mobilise tes connaissances sur cette entreprise.\n"
        "2. Remplis les 9 blocs selon le schéma demandé.\n"
        "3. Rédige une analyse stratégique pour chaque bloc (leviers, risques, différenciation).\n"
        "4. Ajoute une synthèse globale.\n\n"
        "Réponds UNIQUEMENT avec le JSON final, sans texte d'accompagnement."
    )


# ────────────────────────────────────────────────────────────────────────
#  API call
# ────────────────────────────────────────────────────────────────────────

def call_openrouter(api_key: str, company: str, model: str, insecure: bool, timeout: int = 120) -> str:
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(company)},
        ],
        "temperature": 0.4,
        "max_tokens": 4000,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://github.com/ahmedkachlef-ux/Ahmed",
        "X-Title": "BMC CLI",
    }

    if insecure:
        import urllib3  # local import — only if the user opts in
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    res = requests.post(
        OPENROUTER_URL,
        json=body,
        headers=headers,
        verify=not insecure,
        timeout=timeout,
    )
    if not res.ok:
        try:
            err = res.json().get("error", {})
            msg = err.get("message") if isinstance(err, dict) else str(err)
        except Exception:
            msg = res.text
        raise RuntimeError(f"OpenRouter {res.status_code}: {msg}")

    data = res.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"Réponse OpenRouter inattendue : {data}") from exc


# ────────────────────────────────────────────────────────────────────────
#  JSON extraction
# ────────────────────────────────────────────────────────────────────────

def extract_json(text: str) -> dict[str, Any]:
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
    cleaned = re.sub(r"```\s*$", "", cleaned)
    for candidate in (cleaned, text):
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass
    first, last = cleaned.find("{"), cleaned.rfind("}")
    if first >= 0 and last > first:
        try:
            return json.loads(cleaned[first : last + 1])
        except json.JSONDecodeError:
            pass
    raise RuntimeError("Impossible de parser la réponse JSON du modèle.\nContenu brut :\n" + text)


def validate_bmc(bmc: dict[str, Any]) -> None:
    if "error" in bmc:
        raise RuntimeError(bmc["error"])
    expected = {
        "keyPartnerships", "keyActivities", "keyResources",
        "valuePropositions", "customerRelationships", "channels",
        "customerSegments", "costStructure", "revenueStreams",
    }
    blocks = bmc.get("blocks") or {}
    missing = expected - set(blocks.keys())
    if missing:
        raise RuntimeError(f"Blocs manquants dans la réponse : {', '.join(sorted(missing))}")


# ────────────────────────────────────────────────────────────────────────
#  Terminal rendering
# ────────────────────────────────────────────────────────────────────────

BLOCKS_FR = [
    ("keyPartnerships",       "🤝 PARTENAIRES CLÉS",      "95"),
    ("keyActivities",         "⚙️  ACTIVITÉS CLÉS",        "38"),
    ("keyResources",          "🏗️  RESSOURCES CLÉS",       "36"),
    ("valuePropositions",     "💎 PROPOSITION DE VALEUR", "33"),
    ("customerRelationships", "💬 RELATIONS CLIENTS",      "35"),
    ("channels",              "📡 CANAUX",                "32"),
    ("customerSegments",      "👥 SEGMENTS DE CLIENTÈLE", "31"),
    ("costStructure",         "💸 STRUCTURE DE COÛTS",    "90"),
    ("revenueStreams",        "💰 SOURCES DE REVENUS",    "92"),
]


def color(text: str, code: str) -> str:
    if not sys.stdout.isatty():
        return text
    return f"\033[{code}m{text}\033[0m"


def bold(text: str) -> str:
    return color(text, "1")


def dim(text: str) -> str:
    return color(text, "2")


def wrap(text: str, width: int = 78, indent: str = "  ") -> str:
    return textwrap.fill(
        text, width=width,
        initial_indent=indent, subsequent_indent=indent,
        break_long_words=False, break_on_hyphens=False,
    )


def render_terminal(bmc: dict[str, Any]) -> None:
    company = bmc.get("company") or {}
    name = company.get("name") or "—"
    tagline = company.get("tagline") or ""

    width = 80
    print()
    print(bold(color("╔" + "═" * (width - 2) + "╗", "36")))
    print(bold(color("║" + f" BUSINESS MODEL CANVAS — {name}".ljust(width - 2)[: width - 2] + "║", "36")))
    if tagline:
        print(bold(color("║" + f" {tagline}".ljust(width - 2)[: width - 2] + "║", "36")))
    print(bold(color("╚" + "═" * (width - 2) + "╝", "36")))
    print()

    for key, label, ansi in BLOCKS_FR:
        block = bmc["blocks"].get(key) or {}
        print(color(f"── {label} " + "─" * max(3, width - len(label) - 5), ansi))
        for item in block.get("items") or []:
            title = (item.get("title") or "").strip()
            desc = (item.get("description") or "").strip()
            bullet = color("●", ansi)
            print(f"  {bullet} {bold(title)}")
            if desc:
                print(dim(wrap(desc, width=width - 4, indent="     ")))
        analysis = (block.get("analysis") or "").strip()
        if analysis:
            print()
            print(color("  ▸ Analyse stratégique :", ansi))
            print(wrap(analysis, width=width - 4, indent="     "))
        print()

    synthesis = (bmc.get("synthesis") or "").strip()
    if synthesis:
        print(bold(color("── 🧭 SYNTHÈSE STRATÉGIQUE GLOBALE " + "─" * (width - 36), "33")))
        print(wrap(synthesis, width=width - 2, indent="  "))
        print()


# ────────────────────────────────────────────────────────────────────────
#  Entrypoint
# ────────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Génère un Business Model Canvas pour une entreprise via OpenRouter.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent(
            """
            Exemples :
              python bmc_cli.py "Spotify"
              python bmc_cli.py --model google/gemini-2.0-flash-exp:free "Airbnb"
              python bmc_cli.py -o tesla.json "Tesla"

            Clé API : définissez OPENROUTER_API_KEY dans votre environnement.
            """
        ),
    )
    parser.add_argument("company", help="Nom de l'entreprise à analyser")
    parser.add_argument(
        "--model",
        default=os.environ.get("OPENROUTER_MODEL", "openai/gpt-3.5-turbo"),
        help="ID du modèle OpenRouter (défaut : openai/gpt-3.5-turbo)",
    )
    parser.add_argument("-o", "--output", help="Sauvegarde le JSON dans un fichier")
    parser.add_argument("--raw", action="store_true", help="Imprime le JSON brut au lieu du canvas coloré")
    parser.add_argument("--insecure", action="store_true", help="Désactive la vérification SSL (debug uniquement)")
    parser.add_argument("--timeout", type=int, default=120, help="Timeout de la requête en secondes")
    args = parser.parse_args()

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        try:
            from getpass import getpass
            api_key = getpass("OPENROUTER_API_KEY : ").strip()
        except (EOFError, KeyboardInterrupt):
            print("Clé API requise.", file=sys.stderr)
            return 2
    if not api_key:
        print("Clé API vide — abandon.", file=sys.stderr)
        return 2

    print(f"→ Génération du BMC pour « {args.company} » via {args.model}…", file=sys.stderr)

    try:
        raw = call_openrouter(api_key, args.company, args.model, args.insecure, args.timeout)
        bmc = extract_json(raw)
        validate_bmc(bmc)
    except Exception as exc:
        print(f"✗ {exc}", file=sys.stderr)
        return 1

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(bmc, f, ensure_ascii=False, indent=2)
        print(f"✓ BMC sauvegardé dans {args.output}", file=sys.stderr)

    if args.raw:
        print(json.dumps(bmc, ensure_ascii=False, indent=2))
    else:
        render_terminal(bmc)

    return 0


if __name__ == "__main__":
    sys.exit(main())
