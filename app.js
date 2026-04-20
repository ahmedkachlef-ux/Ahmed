/* Business Model Canvas Generator
 * Supports two providers:
 *   - Anthropic direct (claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5)
 *   - OpenRouter (anthropic/claude, openai/gpt, google/gemini, meta-llama/..., etc.)
 *
 * Web search:
 *   - Anthropic: native `web_search_20250305` tool
 *   - OpenRouter: `:online` model suffix (Exa-powered plugin)
 */

const STORAGE_KEY = "bmc-generator.settings.v2";

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const BLOCKS = [
  { key: "keyPartnerships" },
  { key: "keyActivities" },
  { key: "keyResources" },
  { key: "valuePropositions" },
  { key: "customerRelationships" },
  { key: "channels" },
  { key: "customerSegments" },
  { key: "costStructure" },
  { key: "revenueStreams" },
];

const DEFAULT_SETTINGS = {
  provider: "openrouter",
  apiKey: "",
  modelAnthropic: "claude-opus-4-7",
  modelOpenRouter: "deepseek/deepseek-chat-v3-0324:free",
  webSearch: false,
};

const isFreeModel = (id) => typeof id === "string" && id.endsWith(":free");

/* ---------- Settings ---------- */

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch { return {}; }
}
function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
function getSettings() {
  return { ...DEFAULT_SETTINGS, ...loadSettings() };
}

/* ---------- UI helpers ---------- */

const $ = (sel) => document.querySelector(sel);

function setStatus(message) { $("#statusText").textContent = message; }

function showLoading(message) {
  $("#errorSection").hidden = true;
  $("#canvasSection").hidden = true;
  $("#statusSection").hidden = false;
  setStatus(message);
}
function hideLoading() { $("#statusSection").hidden = true; }

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

function buildSystemPrompt(webSearch) {
  const sourceInstruction = webSearch
    ? `- Utiliser la recherche web pour collecter des informations récentes, factuelles et précises sur l'entreprise demandée (site officiel, rapports annuels, presse spécialisée, sources sectorielles).`
    : `- T'appuyer sur tes connaissances d'entraînement sur l'entreprise demandée (modèle d'affaires, historique, positionnement, clients typiques, partenaires connus, structure de revenus publique). Si tu n'as aucune information fiable sur l'entreprise, retourne l'objet d'erreur JSON.`;

  const sourcesField = webSearch
    ? `"sources": ["<url1>", "<url2>", ...]`
    : `"sources": []`;

  return `Tu es un expert senior en stratégie d'entreprise, spécialisé dans le modèle Business Model Canvas d'Alexander Osterwalder & Yves Pigneur.

Ton rôle :
${sourceInstruction}
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
  ${sourcesField}
}`;
}

function buildUserPrompt(company, webSearch) {
  const step1 = webSearch
    ? `1. Effectue une recherche web pour obtenir des informations récentes et factuelles (modèle d'affaires, clients, revenus, partenaires, canaux, coûts).`
    : `1. Mobilise tes connaissances sur cette entreprise (modèle d'affaires, clients, partenaires, canaux, coûts, revenus connus publiquement).`;
  const step5 = webSearch
    ? `5. Liste les URLs des sources consultées dans "sources".`
    : `5. Laisse "sources" à [] (pas de recherche web activée).`;

  return `Génère le Business Model Canvas complet de l'entreprise suivante : "${company}".

Étapes :
${step1}
2. Remplis les 9 blocs selon le schéma demandé.
3. Rédige une analyse stratégique pour chaque bloc (leviers, risques, différenciation).
4. Ajoute une synthèse globale.
${step5}

Réponds UNIQUEMENT avec le JSON final, sans texte d'accompagnement.`;
}

/* ---------- Anthropic provider ---------- */

async function callAnthropic(company, settings, onProgress) {
  const body = {
    model: settings.modelAnthropic,
    max_tokens: 8000,
    system: buildSystemPrompt(settings.webSearch),
    messages: [{ role: "user", content: buildUserPrompt(company, settings.webSearch) }],
  };
  if (settings.webSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }];
  }

  onProgress?.("Appel Anthropic + recherche web…");

  const res = await fetch(ANTHROPIC_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": ANTHROPIC_VERSION,
      "x-api-key": settings.apiKey,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await buildApiError(res, "Anthropic");

  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("Réponse vide du modèle Anthropic.");
  return text;
}

/* ---------- OpenRouter provider ---------- */

async function callOpenRouter(company, settings, onProgress) {
  const base = (settings.modelOpenRouter || "").trim();
  if (!base) throw new Error("Modèle OpenRouter manquant.");

  // Web search via :online plugin is paid. Silently ignore it for :free models.
  const webSearch = settings.webSearch && !isFreeModel(base);
  const model = webSearch && !base.endsWith(":online") ? `${base}:online` : base;

  const body = {
    model,
    messages: [
      { role: "system", content: buildSystemPrompt(webSearch) },
      { role: "user", content: buildUserPrompt(company, webSearch) },
    ],
    max_tokens: 8000,
    temperature: 0.4,
  };

  onProgress?.(`Appel OpenRouter (${model})…`);

  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${settings.apiKey}`,
      "HTTP-Referer": window.location.origin || "https://bmc-generator.local",
      "X-Title": "Business Model Canvas Generator",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await buildApiError(res, "OpenRouter");

  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  const text = typeof msg?.content === "string"
    ? msg.content
    : Array.isArray(msg?.content)
      ? msg.content.filter((p) => p.type === "text").map((p) => p.text).join("\n")
      : "";
  if (!text.trim()) throw new Error("Réponse vide du modèle OpenRouter.");
  return text.trim();
}

async function buildApiError(res, providerLabel) {
  const text = await res.text();
  let msg = `${providerLabel} — erreur ${res.status}`;
  try {
    const parsed = JSON.parse(text);
    if (parsed.error?.message) msg = `${providerLabel} : ${parsed.error.message}`;
    else if (typeof parsed.error === "string") msg = `${providerLabel} : ${parsed.error}`;
  } catch { /* keep default */ }
  return new Error(msg);
}

/* ---------- JSON extraction ---------- */

function tryParseJson(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const attempts = [cleaned, text];
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) attempts.push(cleaned.slice(first, last + 1));
  for (const c of attempts) {
    try { return JSON.parse(c); } catch { /* try next */ }
  }
  return null;
}

function validateBmc(parsed) {
  if (parsed.error) throw new Error(parsed.error);
  if (!parsed.blocks) throw new Error("Structure JSON invalide : blocs manquants.");
  for (const { key } of BLOCKS) {
    if (!parsed.blocks[key]) throw new Error(`Bloc manquant dans la réponse : ${key}`);
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
    blockEl.querySelector(".bmc-body").innerHTML = renderItems(block.items || []);
    blockEl.querySelector(".bmc-analysis p").textContent = block.analysis || "";
  }

  if (bmc.synthesis) {
    $("#synthesisSection").hidden = false;
    $("#synthesisBody").innerHTML = `<p>${escapeHtml(bmc.synthesis)}</p>`;
  }

  const sources = Array.isArray(bmc.sources) ? bmc.sources.filter(Boolean) : [];
  if (sources.length) {
    $("#sourcesWrapper").hidden = false;
    $("#sourcesList").innerHTML = sources
      .map((url) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`)
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

/* ---------- Flow ---------- */

async function generate(company) {
  const settings = getSettings();
  if (!settings.apiKey) {
    openSettings("Ajoutez votre clé API pour démarrer l'analyse.");
    return;
  }

  clearCanvas();
  showLoading(`Recherche en cours sur « ${company} »…`);
  $("#generateBtn").disabled = true;

  try {
    const raw = settings.provider === "openrouter"
      ? await callOpenRouter(company, settings, setStatus)
      : await callAnthropic(company, settings, setStatus);

    setStatus("Analyse des résultats…");
    const parsed = tryParseJson(raw);
    if (!parsed) throw new Error("Impossible de parser la réponse JSON du modèle.");
    validateBmc(parsed);
    renderBmc(parsed);
  } catch (err) {
    console.error(err);
    showError(err.message || String(err));
  } finally {
    $("#generateBtn").disabled = false;
  }
}

/* ---------- Settings dialog ---------- */

function applyProviderUi(provider) {
  const isAnthropic = provider === "anthropic";
  document.querySelectorAll("#providerSegmented .segment").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.provider === provider);
  });

  $("#apiKeyLabel").textContent = isAnthropic ? "Clé API Anthropic" : "Clé API OpenRouter";
  $("#apiKeyInput").placeholder = isAnthropic ? "sk-ant-…" : "sk-or-…";
  $("#apiKeyHelp").href = isAnthropic
    ? "https://console.anthropic.com/settings/keys"
    : "https://openrouter.ai/keys";

  $("#modelSelect").hidden = !isAnthropic;
  $("#openrouterModelWrapper").hidden = isAnthropic;

  updateWebSearchAvailability();
}

function updateWebSearchAvailability() {
  const activeProvider = document.querySelector("#providerSegmented .segment.is-active")?.dataset.provider || "openrouter";
  const note = $("#webSearchNote");
  const checkbox = $("#useWebSearch");

  if (activeProvider === "openrouter") {
    const current = $("#openrouterModelInput").value.trim();
    if (isFreeModel(current)) {
      checkbox.checked = false;
      checkbox.disabled = true;
      note.textContent = "Indisponible sur les modèles gratuits — le plugin de recherche web est payant. L'analyse utilisera les connaissances du modèle.";
      return;
    }
  }
  checkbox.disabled = false;
  note.textContent = "";
}

function openSettings(hintMessage) {
  const dialog = $("#settingsDialog");
  const settings = getSettings();

  applyProviderUi(settings.provider);
  $("#apiKeyInput").value = settings.apiKey || "";
  $("#modelSelect").value = settings.modelAnthropic;
  $("#openrouterModelInput").value = settings.modelOpenRouter;
  $("#useWebSearch").checked = settings.webSearch !== false;

  const help = dialog.querySelector(".dialog-help");
  help.innerHTML = hintMessage
    ? escapeHtml(hintMessage)
    : 'Choisissez votre fournisseur. La clé API est stockée uniquement dans le <strong>localStorage</strong> de votre navigateur.';

  if (!dialog.open) dialog.showModal();
}

function setupSettingsDialog() {
  const dialog = $("#settingsDialog");
  $("#settingsBtn").addEventListener("click", () => openSettings());

  document.querySelectorAll("#providerSegmented .segment").forEach((btn) => {
    btn.addEventListener("click", () => applyProviderUi(btn.dataset.provider));
  });

  $("#openrouterModelInput").addEventListener("input", updateWebSearchAvailability);
  $("#openrouterModelInput").addEventListener("change", updateWebSearchAvailability);

  dialog.addEventListener("close", () => {
    if (dialog.returnValue !== "save") return;
    const activeSegment = document.querySelector("#providerSegmented .segment.is-active");
    const provider = activeSegment?.dataset.provider || "openrouter";
    const next = {
      provider,
      apiKey: $("#apiKeyInput").value.trim(),
      modelAnthropic: $("#modelSelect").value,
      modelOpenRouter: $("#openrouterModelInput").value.trim() || DEFAULT_SETTINGS.modelOpenRouter,
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
  migrateOldSettings();
  setupSettingsDialog();
  setupForm();
  if (!getSettings().apiKey) openSettings();
});

function migrateOldSettings() {
  const oldKey = "bmc-generator.settings.v1";
  if (localStorage.getItem(STORAGE_KEY)) return;
  try {
    const raw = localStorage.getItem(oldKey);
    if (!raw) return;
    const old = JSON.parse(raw);
    const migrated = {
      provider: "anthropic",
      apiKey: old.apiKey || "",
      modelAnthropic: old.model || DEFAULT_SETTINGS.modelAnthropic,
      modelOpenRouter: DEFAULT_SETTINGS.modelOpenRouter,
      webSearch: old.webSearch !== false,
    };
    saveSettings(migrated);
  } catch { /* ignore */ }
}
