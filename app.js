/* Business Model Canvas Generator
 * Uses the Anthropic Claude API with the web_search tool to build a
 * dynamic BMC for any company provided by the user.
 */

const STORAGE_KEY = "bmc-generator.settings.v1";
const API_ENDPOINT = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

const BLOCKS = [
  { key: "keyPartnerships",       label: "Partenaires clés" },
  { key: "keyActivities",         label: "Activités clés" },
  { key: "keyResources",          label: "Ressources clés" },
  { key: "valuePropositions",     label: "Proposition de valeur" },
  { key: "customerRelationships", label: "Relations clients" },
  { key: "channels",              label: "Canaux" },
  { key: "customerSegments",      label: "Segments de clientèle" },
  { key: "costStructure",         label: "Structure de coûts" },
  { key: "revenueStreams",        label: "Sources de revenus" },
];

/* ---------- Settings ---------- */

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function getSettings() {
  return {
    apiKey: "",
    model: "claude-opus-4-7",
    webSearch: true,
    ...loadSettings(),
  };
}

/* ---------- UI helpers ---------- */

const $ = (sel) => document.querySelector(sel);

function setStatus(message) {
  $("#statusText").textContent = message;
}

function showLoading(message) {
  $("#errorSection").hidden = true;
  $("#canvasSection").hidden = true;
  $("#statusSection").hidden = false;
  setStatus(message);
}

function hideLoading() {
  $("#statusSection").hidden = true;
}

function showError(message) {
  hideLoading();
  $("#errorSection").hidden = false;
  $("#errorText").textContent = message;
}

function clearCanvas() {
  document.querySelectorAll(".bmc-block .bmc-body").forEach((el) => (el.innerHTML = ""));
  document.querySelectorAll(".bmc-analysis p").forEach((el) => (el.textContent = ""));
  $("#synthesisBody").innerHTML = "";
  $("#sourcesList").innerHTML = "";
  $("#sourcesWrapper").hidden = true;
  $("#synthesisSection").hidden = true;
}

/* ---------- Prompt ---------- */

function buildSystemPrompt() {
  return `Tu es un expert senior en stratégie d'entreprise, spécialisé dans le modèle Business Model Canvas d'Alexander Osterwalder & Yves Pigneur.

Ton rôle :
- Utiliser la recherche web pour collecter des informations récentes, factuelles et précises sur l'entreprise demandée (site officiel, rapports annuels, presse spécialisée, sources sectorielles).
- Structurer ces informations selon les 9 blocs EXACTS du Business Model Canvas.
- Pour chaque bloc, fournir 3 à 6 éléments clés (chacun avec un titre court et une description concise) ET une analyse stratégique de 2 à 4 phrases qui explique la logique, les forces, les risques ou les leviers de différenciation.
- Conclure avec une synthèse stratégique globale (3-5 phrases) : positionnement, avantages compétitifs durables, vulnérabilités, opportunités.

Règles strictes :
1. Tu dois IMPÉRATIVEMENT répondre avec un objet JSON valide, sans aucun texte avant ou après, sans balise markdown, sans commentaires.
2. Les 9 blocs doivent tous être renseignés avec du contenu spécifique à l'entreprise (pas de remplissage générique).
3. La langue de sortie est le FRANÇAIS.
4. Si l'entreprise n'existe pas ou est introuvable, retourne { "error": "Entreprise introuvable : <raison>" }.

Schéma JSON attendu :
{
  "company": { "name": "<nom officiel>", "tagline": "<1 phrase résumant l'entreprise>" },
  "blocks": {
    "keyPartnerships":       { "items": [{ "title": "...", "description": "..." }, ...], "analysis": "..." },
    "keyActivities":         { "items": [...], "analysis": "..." },
    "keyResources":          { "items": [...], "analysis": "..." },
    "valuePropositions":     { "items": [...], "analysis": "..." },
    "customerRelationships": { "items": [...], "analysis": "..." },
    "channels":              { "items": [...], "analysis": "..." },
    "customerSegments":      { "items": [...], "analysis": "..." },
    "costStructure":         { "items": [...], "analysis": "..." },
    "revenueStreams":        { "items": [...], "analysis": "..." }
  },
  "synthesis": "<synthèse stratégique globale en 3-5 phrases>",
  "sources": ["<url1>", "<url2>", ...]
}`;
}

function buildUserPrompt(company) {
  return `Génère le Business Model Canvas complet de l'entreprise suivante : "${company}".

Étapes :
1. Effectue une recherche web pour obtenir des informations récentes et factuelles (modèle d'affaires, clients, revenus, partenaires, canaux, coûts).
2. Remplis les 9 blocs selon le schéma demandé.
3. Rédige une analyse stratégique pour chaque bloc (leviers, risques, différenciation).
4. Ajoute une synthèse globale.
5. Liste les URLs des sources consultées dans "sources".

Réponds UNIQUEMENT avec le JSON final, sans texte d'accompagnement.`;
}

/* ---------- API call ---------- */

async function callClaude(company, settings, onProgress) {
  const body = {
    model: settings.model,
    max_tokens: 8000,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(company) }],
  };

  if (settings.webSearch) {
    body.tools = [
      { type: "web_search_20250305", name: "web_search", max_uses: 6 },
    ];
  }

  const headers = {
    "Content-Type": "application/json",
    "anthropic-version": API_VERSION,
    "x-api-key": settings.apiKey,
    "anthropic-dangerous-direct-browser-access": "true",
  };

  onProgress?.("Interrogation de Claude et recherche web en cours…");

  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `Erreur API (${res.status})`;
    try {
      const parsed = JSON.parse(text);
      if (parsed.error?.message) msg = parsed.error.message;
    } catch { /* keep default */ }
    throw new Error(msg);
  }

  const data = await res.json();
  return extractJsonResponse(data);
}

function extractJsonResponse(data) {
  const textBlocks = (data.content || [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text);

  const combined = textBlocks.join("\n").trim();
  if (!combined) throw new Error("Réponse vide du modèle.");

  const parsed = tryParseJson(combined);
  if (!parsed) {
    throw new Error("Impossible de parser la réponse JSON du modèle.");
  }

  if (parsed.error) throw new Error(parsed.error);

  validateBmc(parsed);
  return parsed;
}

function tryParseJson(text) {
  const attempts = [
    text,
    text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, ""),
  ];
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    attempts.push(text.slice(firstBrace, lastBrace + 1));
  }
  for (const candidate of attempts) {
    try { return JSON.parse(candidate); } catch { /* try next */ }
  }
  return null;
}

function validateBmc(parsed) {
  if (!parsed.blocks) throw new Error("Structure JSON invalide : blocs manquants.");
  for (const { key } of BLOCKS) {
    if (!parsed.blocks[key]) {
      throw new Error(`Bloc manquant dans la réponse : ${key}`);
    }
  }
}

/* ---------- Rendering ---------- */

function renderBmc(bmc) {
  hideLoading();
  $("#errorSection").hidden = true;

  $("#companyName").textContent = bmc.company?.name || "—";
  $("#companyTagline").textContent = bmc.company?.tagline || "";

  for (const { key } of BLOCKS) {
    const block = bmc.blocks[key];
    const blockEl = document.querySelector(`.bmc-block[data-key="${key}"]`);
    if (!blockEl || !block) continue;

    const body = blockEl.querySelector(".bmc-body");
    const analysis = blockEl.querySelector(".bmc-analysis p");

    body.innerHTML = renderItems(block.items || []);
    analysis.textContent = block.analysis || "";
  }

  if (bmc.synthesis) {
    $("#synthesisSection").hidden = false;
    $("#synthesisBody").innerHTML = `<p>${escapeHtml(bmc.synthesis)}</p>`;
  }

  const sources = Array.isArray(bmc.sources) ? bmc.sources.filter(Boolean) : [];
  if (sources.length) {
    $("#sourcesWrapper").hidden = false;
    $("#sourcesList").innerHTML = sources
      .map((url) => `<li><a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`)
      .join("");
  }

  $("#canvasSection").hidden = false;
  $("#canvasSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderItems(items) {
  if (!items?.length) return `<p class="item-desc">Aucune information disponible.</p>`;
  return `<ul>${items
    .map((it) => {
      const title = escapeHtml(it.title || "");
      const desc = escapeHtml(it.description || "");
      return `<li><div><div class="item-title">${title}</div>${desc ? `<div class="item-desc">${desc}</div>` : ""}</div></li>`;
    })
    .join("")}</ul>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttr(str) { return escapeHtml(str); }

/* ---------- Flow ---------- */

async function generate(company) {
  const settings = getSettings();
  if (!settings.apiKey) {
    openSettings("Ajoutez votre clé API Anthropic pour démarrer l'analyse.");
    return;
  }

  clearCanvas();
  showLoading(`Recherche en cours sur « ${company} »…`);
  $("#generateBtn").disabled = true;

  try {
    const bmc = await callClaude(company, settings, setStatus);
    renderBmc(bmc);
  } catch (err) {
    console.error(err);
    showError(err.message || String(err));
  } finally {
    $("#generateBtn").disabled = false;
  }
}

/* ---------- Settings dialog ---------- */

function openSettings(hintMessage) {
  const dialog = $("#settingsDialog");
  const settings = getSettings();
  $("#apiKeyInput").value = settings.apiKey || "";
  $("#modelSelect").value = settings.model;
  $("#useWebSearch").checked = settings.webSearch !== false;

  if (hintMessage) {
    const help = dialog.querySelector(".dialog-help");
    help.textContent = hintMessage;
  }
  if (!dialog.open) dialog.showModal();
}

function setupSettingsDialog() {
  const dialog = $("#settingsDialog");
  $("#settingsBtn").addEventListener("click", () => openSettings());

  dialog.addEventListener("close", () => {
    if (dialog.returnValue !== "save") return;
    const next = {
      apiKey: $("#apiKeyInput").value.trim(),
      model: $("#modelSelect").value,
      webSearch: $("#useWebSearch").checked,
    };
    saveSettings(next);
  });
}

/* ---------- Init ---------- */

function setupForm() {
  $("#bmcForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const value = $("#companyInput").value.trim();
    if (!value) return;
    generate(value);
  });

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const name = chip.dataset.company;
      $("#companyInput").value = name;
      generate(name);
    });
  });

  $("#newBtn").addEventListener("click", () => {
    $("#canvasSection").hidden = true;
    $("#companyInput").value = "";
    $("#companyInput").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  $("#printBtn").addEventListener("click", () => window.print());
}

document.addEventListener("DOMContentLoaded", () => {
  setupSettingsDialog();
  setupForm();

  const settings = getSettings();
  if (!settings.apiKey) {
    openSettings();
  }
});
